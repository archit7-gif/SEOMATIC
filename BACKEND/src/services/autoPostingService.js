

const PostingSite = require('../models/PostingSite');
const ContentItem = require('../models/ContentItem');
const PublishResult = require('../models/PublishResult');
const Project = require('../models/Project');
const { PUBLISH_STATUS, CONTENT_STATUS } = require('../config/constants');
const { sleep } = require('../utils/helpers');

class AutoPostingService {
  /**
   * Smart Select - Auto-match content to sites based on task type
   */
  async smartSelectSites(projectId) {
    const content = await ContentItem.find({
      projectId,
      status: CONTENT_STATUS.GENERATED
    });

    if (content.length === 0) {
      return { success: false, message: 'No generated content found' };
    }

    // Group content by task type
    const contentByType = {};
    content.forEach(item => {
      if (!contentByType[item.taskType]) {
        contentByType[item.taskType] = [];
      }
      contentByType[item.taskType].push(item);
    });

    // Get matching sites for each type
    const matches = {};
    for (const [taskType, items] of Object.entries(contentByType)) {
      const sites = await PostingSite.find({
        category: taskType,
        isActive: true
      });
      
      matches[taskType] = {
        contentCount: items.length,
        siteCount: sites.length,
        sites: sites.map(s => ({ id: s._id, name: s.name, url: s.url }))
      };
    }

    return {
      success: true,
      totalContent: content.length,
      matches
    };
  }

  /**
   * Auto-publish with smart matching
   */
  async autoPublishProject(projectId, userId, options = {}) {
    const {
      maxSitesPerContent = 5,
      delayBetweenPosts = 2000,
      retryFailed = true
    } = options;

    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const content = await ContentItem.find({
      projectId,
      status: CONTENT_STATUS.GENERATED
    });

    if (content.length === 0) {
      return {
        success: false,
        message: 'No content available for publishing'
      };
    }

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    // Group content by task type
    const contentByType = {};
    content.forEach(item => {
      if (!contentByType[item.taskType]) {
        contentByType[item.taskType] = [];
      }
      contentByType[item.taskType].push(item);
    });

    // Process each task type
    for (const [taskType, items] of Object.entries(contentByType)) {
      const sites = await PostingSite.find({
        category: taskType,
        isActive: true
      }).limit(maxSitesPerContent);

      if (sites.length === 0) {
        console.log(`No active sites for ${taskType}, skipping ${items.length} items`);
        results.skipped += items.length;
        continue;
      }

      // Publish each content item
      for (const contentItem of items) {
        for (const site of sites) {
          try {
            // Check if already published
            const existing = await PublishResult.findOne({
              contentId: contentItem._id,
              siteId: site._id,
              status: PUBLISH_STATUS.SUCCESS
            });

            if (existing) {
              results.skipped++;
              continue;
            }

            // Simulate posting
            const postResult = await this.simulatePosting(contentItem, site, project);

            // Save result
            await PublishResult.create({
              projectId,
              contentId: contentItem._id,
              siteId: site._id,
              userId,
              status: postResult.success ? PUBLISH_STATUS.SUCCESS : PUBLISH_STATUS.FAILED,
              publishedUrl: postResult.url || null,
              errorMessage: postResult.error || null,
              publishedAt: postResult.success ? new Date() : null,
              processingTime: postResult.processingTime
            });

            if (postResult.success) {
              results.successful++;
              // Update content status
              contentItem.status = CONTENT_STATUS.PUBLISHED;
              await contentItem.save();
            } else {
              results.failed++;
            }

            results.total++;
            results.details.push({
              contentTitle: contentItem.title,
              siteName: site.name,
              status: postResult.success ? 'success' : 'failed',
              url: postResult.url
            });

            // Update site stats
            await site.incrementStats(postResult.success);

            // Rate limiting
            await sleep(delayBetweenPosts);

          } catch (error) {
            console.error(`Publishing error:`, error.message);
            results.failed++;
            results.total++;
          }
        }
      }
    }

    // Update project stats
    await project.updateStats();

    return {
      success: true,
      results
    };
  }

  /**
   * Simulate posting to site (replace with actual API calls in production)
   */
  async simulatePosting(content, site, project) {
    const startTime = Date.now();

    try {
      // Simulate network delay
      await sleep(500 + Math.random() * 1000);

      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1;

      if (!success) {
        throw new Error('Simulated posting failure');
      }

      // Generate published URL
      const slug = content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const url = `${site.url}/${slug}-${Date.now()}`;

      return {
        success: true,
        url,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Publish to specific sites
   */
  async publishToSelectedSites(contentIds, siteIds, userId) {
    const results = [];

    for (const contentId of contentIds) {
      const content = await ContentItem.findById(contentId);
      if (!content) {
        results.push({
          contentId,
          error: 'Content not found',
          success: false
        });
        continue;
      }

      for (const siteId of siteIds) {
        const site = await PostingSite.findById(siteId);
        if (!site) {
          results.push({
            contentId,
            siteId,
            error: 'Site not found',
            success: false
          });
          continue;
        }

        try {
          const project = await Project.findById(content.projectId);
          const postResult = await this.simulatePosting(content, site, project);

          await PublishResult.create({
            projectId: content.projectId,
            contentId: content._id,
            siteId: site._id,
            userId,
            status: postResult.success ? PUBLISH_STATUS.SUCCESS : PUBLISH_STATUS.FAILED,
            publishedUrl: postResult.url || null,
            errorMessage: postResult.error || null,
            publishedAt: postResult.success ? new Date() : null,
            processingTime: postResult.processingTime
          });

          if (postResult.success) {
            content.status = CONTENT_STATUS.PUBLISHED;
            await content.save();
          }

          await site.incrementStats(postResult.success);

          results.push({
            contentId,
            siteId,
            success: postResult.success,
            url: postResult.url,
            error: postResult.error
          });

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
   * Get publishing statistics
   */
  async getPublishingStats(projectId) {
    const results = await PublishResult.find({ projectId });

    const stats = {
      total: results.length,
      successful: 0,
      failed: 0,
      pending: 0,
      byTaskType: {},
      bySite: {},
      recentPublications: []
    };

    // Calculate stats
    results.forEach(result => {
      if (result.status === PUBLISH_STATUS.SUCCESS) stats.successful++;
      if (result.status === PUBLISH_STATUS.FAILED) stats.failed++;
      if (result.status === PUBLISH_STATUS.PENDING) stats.pending++;
    });

    // Get recent publications
    const recent = await PublishResult.find({ projectId })
      .populate('contentId', 'title taskType')
      .populate('siteId', 'name url')
      .sort({ createdAt: -1 })
      .limit(10);

    stats.recentPublications = recent.map(r => ({
      title: r.contentId?.title,
      site: r.siteId?.name,
      url: r.publishedUrl,
      status: r.status,
      publishedAt: r.publishedAt
    }));

    return stats;
  }

  /**
   * Retry failed publications
   */
  async retryFailedPublications(projectId, userId) {
    const failed = await PublishResult.find({
      projectId,
      status: PUBLISH_STATUS.FAILED
    }).populate('contentId').populate('siteId');

    const retryResults = [];

    for (const result of failed) {
      if (!result.contentId || !result.siteId) continue;

      try {
        const project = await Project.findById(projectId);
        const postResult = await this.simulatePosting(
          result.contentId,
          result.siteId,
          project
        );

        // Update existing result
        result.status = postResult.success ? PUBLISH_STATUS.SUCCESS : PUBLISH_STATUS.FAILED;
        result.publishedUrl = postResult.url || null;
        result.errorMessage = postResult.error || null;
        result.publishedAt = postResult.success ? new Date() : null;
        result.attemptCount = (result.attemptCount || 1) + 1;
        await result.save();

        retryResults.push({
          contentId: result.contentId._id,
          siteId: result.siteId._id,
          success: postResult.success
        });

        await sleep(1000);

      } catch (error) {
        retryResults.push({
          contentId: result.contentId._id,
          siteId: result.siteId._id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      totalRetried: retryResults.length,
      successful: retryResults.filter(r => r.success).length,
      failed: retryResults.filter(r => !r.success).length,
      results: retryResults
    };
  }
}

module.exports = new AutoPostingService();