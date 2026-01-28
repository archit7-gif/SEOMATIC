



const PostingSite = require('../models/PostingSite');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class SitesController {
  /**
   * Create posting site
   * POST /api/sites
   */
  static async createSite(req, res) {
    const { name, url, category, credentials, requiredFields } = req.body;

    const site = await PostingSite.create({
      name,
      url,
      category,
      credentials: credentials || {},
      requiredFields: requiredFields || []
    });

    return ApiResponse.created(res, 'Site created successfully', { site });
  }

  /**
   * Get all posting sites
   * GET /api/sites
   */
  static async getSites(req, res) {
    const { category, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sites = await PostingSite.find(query).sort({ name: 1 });

    return ApiResponse.success(res, 200, 'Sites fetched successfully', {
      count: sites.length,
      sites
    });
  }

  /**
   * Get single site
   * GET /api/sites/:id
   */
  static async getSite(req, res) {
    const { id } = req.params;

    const site = await PostingSite.findById(id);
    if (!site) {
      throw ApiError.notFound('Site not found');
    }

    return ApiResponse.success(res, 200, 'Site fetched successfully', { site });
  }

  /**
   * Update site
   * PUT /api/sites/:id
   */
  static async updateSite(req, res) {
    const { id } = req.params;
    const updates = req.body;

    const site = await PostingSite.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!site) {
      throw ApiError.notFound('Site not found');
    }

    return ApiResponse.success(res, 200, 'Site updated successfully', { site });
  }

  /**
   * Delete site
   * DELETE /api/sites/:id
   */
  static async deleteSite(req, res) {
    const { id } = req.params;

    const site = await PostingSite.findByIdAndDelete(id);
    if (!site) {
      throw ApiError.notFound('Site not found');
    }

    return ApiResponse.success(res, 200, 'Site deleted successfully');
  }

  /**
   * Get sites by category
   * GET /api/sites/category/:category
   */
  static async getSitesByCategory(req, res) {
    const { category } = req.params;

    const sites = await PostingSite.find({ 
      category, 
      isActive: true 
    }).sort({ name: 1 });

    return ApiResponse.success(res, 200, 'Sites fetched successfully', {
      category,
      count: sites.length,
      sites
    });
  }
}

module.exports = SitesController;