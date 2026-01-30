
const autoPostingService = require('../services/autoPostingService');
const Project = require('../models/Project');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class AutoPostingController {
  /**
   * ✅ NEW: Smart Select - Get matched sites for project content
   * GET /api/auto-posting/smart-select/:projectId
   */
  static async smartSelect(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const matches = await autoPostingService.smartSelectSites(projectId);

    return ApiResponse.success(res, 200, 'Smart select completed', matches);
  }

  /**
   * ✅ NEW: Auto-publish project with smart matching
   * POST /api/auto-posting/auto-publish
   */
  static async autoPublish(req, res) {
    const { projectId, options } = req.body;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Start async auto-publishing
    autoPostingService.autoPublishProject(projectId, userId, options)
      .then(result => {
        console.log('✅ Auto-publishing completed:', result);
        // Update project status
        project.status = 'completed';
        project.completedAt = new Date();
        project.save().catch(err => console.error('Failed to update project:', err));
      })
      .catch(err => console.error('❌ Auto-publishing error:', err));

    return ApiResponse.success(res, 200, 'Auto-publishing started', {
      projectId,
      message: 'Content is being published to matching sites automatically'
    });
  }

  /**
   * Publish to specific sites (manual selection)
   * POST /api/auto-posting/publish-selected
   */
  static async publishSelected(req, res) {
    const { contentIds, siteIds } = req.body;
    const userId = req.user._id;

    if (!contentIds?.length || !siteIds?.length) {
      throw ApiError.badRequest('contentIds and siteIds are required');
    }

    // Start async publishing
    autoPostingService.publishToSelectedSites(contentIds, siteIds, userId)
      .then(results => {
        console.log('✅ Selected publishing completed:', results.length, 'items');
      })
      .catch(err => console.error('❌ Selected publishing error:', err));

    return ApiResponse.success(res, 200, 'Publishing to selected sites started', {
      totalContent: contentIds.length,
      totalSites: siteIds.length,
      totalAttempts: contentIds.length * siteIds.length
    });
  }

  /**
   * Get publishing statistics
   * GET /api/auto-posting/stats/:projectId
   */
  static async getStats(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const stats = await autoPostingService.getPublishingStats(projectId);

    return ApiResponse.success(res, 200, 'Statistics fetched successfully', {
      stats
    });
  }

  /**
   * Retry failed publications
   * POST /api/auto-posting/retry
   */
  static async retryFailed(req, res) {
    const { projectId } = req.body;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Start async retry
    autoPostingService.retryFailedPublications(projectId, userId)
      .then(result => {
        console.log('✅ Retry completed:', result);
      })
      .catch(err => console.error('❌ Retry error:', err));

    return ApiResponse.success(res, 200, 'Retry started', {
      projectId,
      message: 'Failed publications are being retried'
    });
  }

  /**
   * ✅ NEW: Get publish results for project
   * GET /api/auto-posting/results/:projectId
   */
  static async getResults(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 20, status } = req.query;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const PublishResult = require('../models/PublishResult');
    
    const query = { projectId, userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      PublishResult.find(query)
        .populate('contentId', 'title taskType')
        .populate('siteId', 'name url')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PublishResult.countDocuments(query)
    ]);

    return ApiResponse.success(res, 200, 'Results fetched successfully', {
      results,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  /**
   * ✅ NEW: Get successful backlinks only
   * GET /api/auto-posting/backlinks/:projectId
   */
  static async getBacklinks(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify project
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const PublishResult = require('../models/PublishResult');
    
    const backlinks = await PublishResult.find({
      projectId,
      userId,
      status: 'success',
      publishedUrl: { $exists: true, $ne: null }
    })
      .populate('contentId', 'title targetLink taskType')
      .populate('siteId', 'name url')
      .select('publishedUrl publishedAt')
      .sort({ publishedAt: -1 });

    return ApiResponse.success(res, 200, 'Backlinks fetched successfully', {
      count: backlinks.length,
      backlinks: backlinks.map(b => ({
        title: b.contentId?.title,
        taskType: b.contentId?.taskType,
        targetLink: b.contentId?.targetLink,
        publishedUrl: b.publishedUrl,
        siteName: b.siteId?.name,
        siteUrl: b.siteId?.url,
        publishedAt: b.publishedAt
      }))
    });
  }
}

module.exports = AutoPostingController;