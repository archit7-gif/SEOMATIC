
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const ApiError = require('../utils/ApiError');

class ExcelService {
  /**
   * Read Excel file and parse data
   * @param {string} filePath - Path to Excel file
   * @returns {array} - Array of row objects
   */
  static readExcel(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw ApiError.notFound('Excel file not found');
      }

      // Read the workbook
      const workbook = XLSX.readFile(filePath);
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, {
        defval: '', // Default value for empty cells
        raw: false  // Return formatted strings
      });

      if (data.length === 0) {
        throw ApiError.badRequest('Excel file is empty');
      }

      return data;
      
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      console.error('Excel read error:', error);
      throw ApiError.internal('Failed to read Excel file');
    }
  }

  /**
   * Validate Excel structure for content generation
   * Expected columns: title, description, keyword, target_link, task_type, word_limit (optional)
   * @param {array} data - Excel data
   * @returns {object} - { valid: boolean, errors: array }
   */
  static validateContentExcel(data) {
    const errors = [];
    const requiredColumns = ['title', 'description', 'keyword', 'target_link', 'task_type'];
    
    if (!data || data.length === 0) {
      return { valid: false, errors: ['Excel file is empty'] };
    }

    // Check for required columns in first row
    const firstRow = data[0];
    const availableColumns = Object.keys(firstRow).map(col => col.toLowerCase().trim());
    
    requiredColumns.forEach(col => {
      if (!availableColumns.includes(col)) {
        errors.push(`Missing required column: ${col}`);
      }
    });

    // Validate each row
    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because index starts at 0 and Excel has header row
      
      // Normalize keys to lowercase
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.toLowerCase().trim()] = row[key];
      });

      // Check required fields
      if (!normalizedRow.title || normalizedRow.title.trim() === '') {
        errors.push(`Row ${rowNum}: Title is required`);
      }
      
      if (!normalizedRow.keyword || normalizedRow.keyword.trim() === '') {
        errors.push(`Row ${rowNum}: Keyword is required`);
      }
      
      if (!normalizedRow.target_link || normalizedRow.target_link.trim() === '') {
        errors.push(`Row ${rowNum}: Target link is required`);
      }
      
      if (!normalizedRow.task_type || normalizedRow.task_type.trim() === '') {
        errors.push(`Row ${rowNum}: Task type is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse and normalize Excel data for content generation
   * @param {array} data - Raw Excel data
   * @returns {array} - Normalized data
   */
  static parseContentData(data) {
    return data.map((row, index) => {
      // Normalize keys
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.toLowerCase().trim()] = row[key];
      });

      return {
        rowNumber: index + 2,
        title: (normalizedRow.title || '').trim(),
        description: (normalizedRow.description || '').trim(),
        keyword: (normalizedRow.keyword || '').trim(),
        targetLink: (normalizedRow.target_link || '').trim(),
        taskType: (normalizedRow.task_type || '').toLowerCase().replace(/\s+/g, '_'),
        wordLimit: parseInt(normalizedRow.word_limit) || null,
        quantity: parseInt(normalizedRow.quantity) || 1
      };
    });
  }

  /**
   * Write data to Excel file
   * @param {array} data - Array of objects to write
   * @param {string} outputPath - Output file path
   * @returns {string} - Path to created file
   */
  static writeExcel(data, outputPath) {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Content');
      
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file
      XLSX.writeFile(workbook, outputPath);
      
      return outputPath;
      
    } catch (error) {
      console.error('Excel write error:', error);
      throw ApiError.internal('Failed to create Excel file');
    }
  }

  /**
   * Convert content items to Excel format
   * @param {array} contentItems - Array of ContentItem documents
   * @returns {array} - Array formatted for Excel
   */
  static formatContentForExcel(contentItems) {
    return contentItems.map(item => ({
      'Title': item.title,
      'Description': item.description,
      'Content': item.body,
      'Keywords': item.keywords.join(', '),
      'Target Link': item.targetLink,
      'Task Type': item.taskType,
      'Word Count': item.actualWordCount,
      'Status': item.status,
      'Generated At': item.generationMetadata?.generatedAt 
        ? new Date(item.generationMetadata.generatedAt).toLocaleString()
        : 'N/A'
    }));
  }

  /**
   * Generate Excel report with published links
   * @param {array} publishResults - Array of publish result documents
   * @returns {array} - Array formatted for Excel report
   */
  static formatReportForExcel(publishResults) {
    return publishResults.map(result => ({
      'Content Title': result.contentId?.title || 'N/A',
      'Task Type': result.contentId?.taskType || 'N/A',
      'Website': result.siteId?.name || 'N/A',
      'Published URL': result.publishedUrl || 'Failed',
      'Status': result.status,
      'Error Message': result.errorMessage || '',
      'Published At': result.createdAt 
        ? new Date(result.createdAt).toLocaleString()
        : 'N/A'
    }));
  }

  /**
   * Delete uploaded file
   * @param {string} filePath - Path to file
   */
  static deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('File delete error:', error);
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Get file size in MB
   * @param {string} filePath 
   * @returns {number}
   */
  static getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return (stats.size / (1024 * 1024)).toFixed(2); // MB
    } catch (error) {
      return 0;
    }
  }
}

module.exports = ExcelService;