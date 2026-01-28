

const path = require('path');
const PublishResult = require('../models/PublishResult');
const ExcelService = require('./excelService');
const ApiError = require('../utils/ApiError');

class ReportService {
  /**
   * Generate backlink report for project
   */
  async generateProjectReport(projectId, userId) {
    // Get all publish results
    const results = await PublishResult.find({ projectId, userId })
      .populate('contentId', 'title description taskType keywords targetLink actualWordCount')
      .populate('siteId', 'name url category')
      .sort({ createdAt: -1 });
    
    if (results.length === 0) {
      throw ApiError.badRequest('No published content found for this project');
    }
    
    // Format for Excel
    const excelData = results.map(result => ({
      'Content Title': result.contentId?.title || 'N/A',
      'Task Type': result.contentId?.taskType || 'N/A',
      'Keywords': result.contentId?.keywords?.join(', ') || 'N/A',
      'Target Link': result.contentId?.targetLink || 'N/A',
      'Word Count': result.contentId?.actualWordCount || 0,
      'Website Name': result.siteId?.name || 'N/A',
      'Website URL': result.siteId?.url || 'N/A',
      'Published Backlink': result.publishedUrl || 'Failed',
      'Status': result.status,
      'Error': result.errorMessage || '',
      'Published Date': result.publishedAt 
        ? new Date(result.publishedAt).toLocaleString()
        : 'N/A'
    }));
    
    // Generate filename
    const filename = `backlink_report_${projectId}_${Date.now()}.xlsx`;
    const outputPath = path.join(process.cwd(), 'reports', filename);
    
    // Create Excel file
    ExcelService.writeExcel(excelData, outputPath);
    
    return {
      filename,
      path: outputPath,
      totalRecords: excelData.length
    };
  }

  /**
   * Generate summary statistics
   */
  async getReportSummary(projectId, userId) {
    const results = await PublishResult.find({ projectId, userId });
    
    const summary = {
      totalPublished: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      byTaskType: {},
      bySite: {}
    };
    
    // Group by task type
    results.forEach(r => {
      const taskType = r.contentId?.taskType || 'unknown';
      if (!summary.byTaskType[taskType]) {
        summary.byTaskType[taskType] = { total: 0, success: 0, failed: 0 };
      }
      summary.byTaskType[taskType].total += 1;
      if (r.status === 'success') summary.byTaskType[taskType].success += 1;
      if (r.status === 'failed') summary.byTaskType[taskType].failed += 1;
    });
    
    // Group by site
    results.forEach(r => {
      const siteName = r.siteId?.name || 'unknown';
      if (!summary.bySite[siteName]) {
        summary.bySite[siteName] = { total: 0, success: 0, failed: 0 };
      }
      summary.bySite[siteName].total += 1;
      if (r.status === 'success') summary.bySite[siteName].success += 1;
      if (r.status === 'failed') summary.bySite[siteName].failed += 1;
    });
    
    return summary;
  }

  /**
   * Get all backlinks for a project
   */
  async getBacklinks(projectId, userId) {
    const results = await PublishResult.find({ 
      projectId, 
      userId,
      status: 'success',
      publishedUrl: { $exists: true, $ne: null }
    })
      .populate('contentId', 'title targetLink')
      .populate('siteId', 'name url')
      .select('publishedUrl publishedAt');
    
    return results.map(r => ({
      title: r.contentId?.title,
      targetLink: r.contentId?.targetLink,
      backlink: r.publishedUrl,
      siteName: r.siteId?.name,
      siteUrl: r.siteId?.url,
      publishedAt: r.publishedAt
    }));
  }
}

module.exports = new ReportService();