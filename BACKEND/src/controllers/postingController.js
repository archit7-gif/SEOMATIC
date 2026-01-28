

const postingService = require('../services/postingService');
const Project = require('../models/Project');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class PostingController {
  /**
   * Publish single content to specific site
   * POST /api/posting/publish-single
   */
  static async publishSingle(req, res) {
    const { contentId, siteId } = req.body;
    const userId = req.user._id;

    const result = await postingService.publishContent(contentId, siteId, userId);

    if (!result.success) {
      return ApiResponse.error(res, 400, result.message || 'Publishing failed');
    }

    return ApiResponse.success(res, 200, 'Content published successfully', {
      result: result.publishResult
    });
  }

  /**
   * Publish multiple content to multiple sites
   * POST /api/posting/publish-bulk
   */
  static async publishBulk(req, res) {
    const { contentIds, siteIds } = req.body;
    const userId = req.user._id;

    if (!contentIds?.length || !siteIds?.length) {
      throw ApiError.badRequest('contentIds and siteIds are required');
    }

    // Start async publishing
    postingService.publishBulk(contentIds, siteIds, userId)
      .then(() => console.log('Bulk publishing completed'))
      .catch(err => console.error('Bulk publishing error:', err));

    return ApiResponse.success(res, 200, 'Bulk publishing started', {
      totalContent: contentIds.length,
      totalSites: siteIds.length,
      totalAttempts: contentIds.length * siteIds.length
    });
  }

  /**
   * Auto-publish project (smart matching)
   * POST /api/posting/auto-publish
   */
  static async autoPublish(req, res) {
    const { projectId } = req.body;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Start async auto-publishing
    postingService.autoPublishProject(projectId, userId)
      .then(result => {
        console.log('Auto-publishing completed:', result);
        // Update project status
        project.status = 'completed';
        project.completedAt = new Date();
        project.save();
      })
      .catch(err => console.error('Auto-publishing error:', err));

    return ApiResponse.success(res, 200, 'Auto-publishing started', {
      projectId,
      message: 'Content is being published to matching sites'
    });
  }

  /**
   * Get publish results for project
   * GET /api/posting/results/:projectId
   */
  static async getResults(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const PublishResult = require('../models/PublishResult');
    const results = await PublishResult.getProjectResults(projectId);

    return ApiResponse.success(res, 200, 'Results fetched successfully', {
      count: results.length,
      results
    });
  }

  /**
   * Get publishing statistics
   * GET /api/posting/stats/:projectId
   */
  static async getStats(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const stats = await postingService.getProjectStats(projectId);

    return ApiResponse.success(res, 200, 'Stats fetched successfully', {
      stats
    });
  }

  /**
   * Retry failed publications
   * POST /api/posting/retry
   */
  static async retryFailed(req, res) {
    const { projectId } = req.body;
    const userId = req.user._id;

    // Get failed results
    const PublishResult = require('../models/PublishResult');
    const failed = await PublishResult.find({
      projectId,
      userId,
      status: 'failed'
    });

    if (failed.length === 0) {
      return ApiResponse.success(res, 200, 'No failed publications to retry');
    }

    // Retry each failed publication
    const retryPromises = failed.map(result => 
      postingService.publishContent(result.contentId, result.siteId, userId)
    );

    Promise.all(retryPromises)
      .then(() => console.log('Retry completed'))
      .catch(err => console.error('Retry error:', err));

    return ApiResponse.success(res, 200, 'Retry started', {
      retrying: failed.length
    });
  }
}

module.exports = PostingController;