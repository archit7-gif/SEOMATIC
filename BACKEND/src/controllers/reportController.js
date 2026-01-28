

const reportService = require('../services/reportService');
const Project = require('../models/Project');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class ReportController {
  /**
   * Generate and download backlink report
   * GET /api/reports/:projectId
   */
  static async generateReport(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const report = await reportService.generateProjectReport(projectId, userId);

    // Send file for download
    res.download(report.path, report.filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      const ExcelService = require('../services/excelService');
      setTimeout(() => ExcelService.deleteFile(report.path), 60000);
    });
  }

  /**
   * Get report summary
   * GET /api/reports/summary/:projectId
   */
  static async getSummary(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const summary = await reportService.getReportSummary(projectId, userId);

    return ApiResponse.success(res, 200, 'Summary fetched successfully', {
      summary
    });
  }

  /**
   * Get all backlinks
   * GET /api/reports/backlinks/:projectId
   */
  static async getBacklinks(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const backlinks = await reportService.getBacklinks(projectId, userId);

    return ApiResponse.success(res, 200, 'Backlinks fetched successfully', {
      count: backlinks.length,
      backlinks
    });
  }
}

module.exports = ReportController;