
const PostingSite = require('../models/PostingSite');
const ContentItem = require('../models/ContentItem');
const PublishResult = require('../models/PublishResult');
const { PUBLISH_STATUS, CONTENT_STATUS } = require('../config/constants');
const { sleep } = require('../utils/helpers');
const mongoose = require('mongoose'); // ✅ Make sure mongoose is imported

class PostingService {
  /**
   * Simulate posting content to a site
   * In production, this would use actual API calls or web scraping
   */
  async postToSite(content, site, userId) {
    const startTime = Date.now();

    try {
      // Simulate API call delay
      await sleep(500 + Math.random() * 1000);

      // Placeholder: success/failure simulation
      const success = Math.random() > 0.1; // 90% success rate

      if (!success) {
        throw new Error('Simulated posting failure');
      }

      // Generate simulated URL
      const publishedUrl = `${site.url}/posts/${Date.now()}-${content._id}`;
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        publishedUrl,
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        processingTime
      };
    }
  }

  /**
   * Get matching sites for content task type
   */
  async getMatchingSites(taskType) {
    return await PostingSite.getByCategoryAndActive(taskType);
  }

  /**
   * Publish single content to specific site
   */
  async publishContent(contentId, siteId, userId) {
    const content = await ContentItem.findById(contentId);
    const site = await PostingSite.findById(siteId);

    if (!content || !site) {
      throw new Error('Content or site not found');
    }

    // Check if already published to this site
    const existing = await PublishResult.findOne({ contentId, siteId });
    if (existing && existing.status === PUBLISH_STATUS.SUCCESS) {
      return {
        success: false,
        message: 'Already published to this site'
      };
    }

    // Attempt to post
    const result = await this.postToSite(content, site, userId);

    // Create publish result
    const publishResult = await PublishResult.create({
      projectId: content.projectId,
      contentId: content._id,
      siteId: site._id,
      userId,
      status: result.success ? PUBLISH_STATUS.SUCCESS : PUBLISH_STATUS.FAILED,
      publishedUrl: result.publishedUrl || null,
      errorMessage: result.error || null,
      publishedAt: result.success ? new Date() : null,
      processingTime: result.processingTime
    });

    // Update content status
    if (result.success) {
      content.status = CONTENT_STATUS.PUBLISHED;
      await content.save();
    }

    // Update site stats
    await site.incrementStats(result.success);

    return {
      success: result.success,
      publishResult
    };
  }

  /**
   * Publish content to multiple sites (bulk)
   */
  async publishBulk(contentIds, siteIds, userId) {
    const results = [];

    for (const contentId of contentIds) {
      for (const siteId of siteIds) {
        try {
          const result = await this.publishContent(contentId, siteId, userId);
          results.push({
            contentId,
            siteId,
            ...result
          });

          // Rate limiting
          await sleep(1000);
        } catch (error) {
          results.push({
            contentId,
            siteId,
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Auto-match and publish project content
   */
  async autoPublishProject(projectId, userId) {
    const contentItems = await ContentItem.find({
      projectId,
      status: CONTENT_STATUS.GENERATED
    });

    if (contentItems.length === 0) {
      return {
        success: false,
        message: 'No content available to publish'
      };
    }

    const results = [];

    const contentByType = {};
    contentItems.forEach(item => {
      if (!contentByType[item.taskType]) contentByType[item.taskType] = [];
      contentByType[item.taskType].push(item);
    });

    for (const [taskType, contents] of Object.entries(contentByType)) {
      const sites = await this.getMatchingSites(taskType);
      if (sites.length === 0) {
        console.log(`No active sites found for task type: ${taskType}`);
        continue;
      }

      for (const content of contents) {
        for (const site of sites) {
          try {
            const result = await this.publishContent(content._id, site._id, userId);
            results.push(result);

            await sleep(1000);
          } catch (error) {
            results.push({
              success: false,
              error: error.message
            });
          }
        }
      }
    }

    return {
      success: true,
      totalAttempts: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Get publish statistics for project
   */
  async getProjectStats(projectId) {
    // ✅ Fixed: use `new mongoose.Types.ObjectId(projectId)`
    const results = await PublishResult.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      success: 0,
      failed: 0,
      pending: 0
    };

    results.forEach(r => {
      stats.total += r.count;
      if (r._id === PUBLISH_STATUS.SUCCESS) stats.success = r.count;
      if (r._id === PUBLISH_STATUS.FAILED) stats.failed = r.count;
      if (r._id === PUBLISH_STATUS.PENDING) stats.pending = r.count;
    });

    return stats;
  }
}

module.exports = new PostingService();
