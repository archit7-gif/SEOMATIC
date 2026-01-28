
const path = require('path');
const Project = require('../models/Project');
const ContentItem = require('../models/ContentItem');
const ExcelService = require('../services/excelService');
const ContentRulesEngine = require('../services/contentRulesEngine');
const geminiService = require('../services/geminiService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { PROJECT_STATUS, CONTENT_STATUS } = require('../config/constants');

class ContentController {
  /**
   * Upload Excel and prepare for generation
   * POST /api/content/upload
   */
  static async uploadExcel(req, res) {
    const { projectId } = req.body;
    const userId = req.user._id;

    if (!req.file) {
      throw ApiError.badRequest('Excel file is required');
    }

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    try {
      const excelData = ExcelService.readExcel(req.file.path);
      const validation = ExcelService.validateContentExcel(excelData);

      if (!validation.valid) {
        ExcelService.deleteFile(req.file.path);
        throw ApiError.badRequest('Excel validation failed', validation.errors);
      }

      const parsedData = ExcelService.parseContentData(excelData);

      project.excelFile = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        uploadedAt: new Date()
      };
      await project.save();

      return ApiResponse.success(res, 200, 'Excel uploaded and validated successfully', {
        rowCount: parsedData.length,
        preview: parsedData.slice(0, 5),
        validation: { valid: true, totalRows: parsedData.length }
      });

    } catch (error) {
      ExcelService.deleteFile(req.file.path);
      throw error;
    }
  }

  /**
   * Generate content from uploaded Excel
   * POST /api/content/generate
   */
  static async generateContent(req, res) {
    const { projectId } = req.body;
    const userId = req.user._id;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (!project.excelFile?.path) {
      throw ApiError.badRequest('No Excel file uploaded for this project');
    }

    const excelData = ExcelService.readExcel(project.excelFile.path);
    const parsedData = ExcelService.parseContentData(excelData);

    project.status = PROJECT_STATUS.CONTENT_GENERATED;
    await project.save();

    // ✅ Background generation safely
    setImmediate(async () => {
      try {
        await ContentController._generateContentAsync(project, parsedData, userId);
      } catch (err) {
        console.error('🔥 Background generation crashed:', err);
      }
    });

    return ApiResponse.success(res, 200, 'Content generation started', {
      totalItems: parsedData.length,
      message: 'Content is being generated. Check project status for updates.'
    });
  }

  /**
   * Generate content asynchronously (internal method)
   */
  static async _generateContentAsync(project, parsedData, userId) {
    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;

    for (const rowData of parsedData) {
      try {
        const prompt = ContentRulesEngine.buildPrompt(project.contentRules, rowData);

        const itemStartTime = Date.now();
        const generatedContent = await geminiService.generateContent(prompt);

        if (!generatedContent || typeof generatedContent !== 'string' || !generatedContent.trim()) {
          throw new Error('AI returned empty content');
        }

        const processingTime = Date.now() - itemStartTime;

        await ContentItem.create({
          projectId: project._id,
          userId,
          taskType: rowData.taskType,
          title: rowData.title,
          description: rowData.description,
          body: generatedContent,
          keywords: rowData.keyword?.split(',').map(k => k.trim()) || [],
          targetLink: rowData.targetLink,
          wordLimit: rowData.wordLimit,
          status: CONTENT_STATUS.GENERATED,
          generationMetadata: {
            attemptCount: 1,
            generatedAt: new Date(),
            aiModel: 'gemini',
            processingTime
          },
          sourceData: {
            rowNumber: rowData.rowNumber,
            originalTitle: rowData.title,
            originalDescription: rowData.description
          }
        });

        successCount++;
        console.log(`✅ Generated content ${successCount}/${parsedData.length}`);

      } catch (error) {
        failCount++;
        console.error(`❌ Failed to generate content for row ${rowData.rowNumber}:`, error.message);

        await ContentItem.create({
          projectId: project._id,
          userId,
          taskType: rowData.taskType,
          title: rowData.title || 'Failed',
          description: rowData.description || '',
          body: '[CONTENT_GENERATION_FAILED]',
          keywords: [],
          targetLink: rowData.targetLink || '',
          status: CONTENT_STATUS.FAILED,
          error: {
            message: error.message,
            timestamp: new Date()
          },
          sourceData: {
            rowNumber: rowData.rowNumber
          }
        });
      }
    }

    // Update project stats safely
    try {
      await project.updateStats();
    } catch (err) {
      console.error('Failed to update project stats:', err);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Content generation completed: ${successCount} succeeded, ${failCount} failed in ${totalTime}s`);
  }

  /**
   * All other controller methods (getContent, updateContent, deleteContent, regenerateContent, downloadContent, getContentByTaskType)
   * remain almost identical but remove any dependency on `next()`. All errors are thrown and caught by asyncHandler in routes.
   */
  // ... (same as your original, no changes needed)

}

module.exports = ContentController;
