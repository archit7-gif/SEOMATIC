
const Category = require('../models/Category');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class CategoryController {
  /**
   * Create category
   * POST /api/categories
   */
  static async createCategory(req, res) {
    const { name, description, parent, taskTypes } = req.body;

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const category = await Category.create({
      name,
      slug,
      description,
      parent: parent || null,
      taskTypes: taskTypes || []
    });

    return ApiResponse.created(res, 'Category created successfully', {
      category
    });
  }

  /**
   * Get all categories
   * GET /api/categories
   */
  static async getCategories(req, res) {
    const { parent, taskType, isActive } = req.query;

    const query = {};
    if (parent) query.parent = parent;
    if (taskType) query.taskTypes = taskType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ name: 1 });

    return ApiResponse.success(res, 200, 'Categories fetched successfully', {
      count: categories.length,
      categories
    });
  }

  /**
   * Get single category
   * GET /api/categories/:id
   */
  static async getCategory(req, res) {
    const { id } = req.params;

    const category = await Category.findById(id).populate('parent', 'name slug');
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    return ApiResponse.success(res, 200, 'Category fetched successfully', {
      category
    });
  }

  /**
   * Update category
   * PUT /api/categories/:id
   */
  static async updateCategory(req, res) {
    const { id } = req.params;
    const updates = req.body;

    // Update slug if name changes
    if (updates.name) {
      updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    return ApiResponse.success(res, 200, 'Category updated successfully', {
      category
    });
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  static async deleteCategory(req, res) {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    return ApiResponse.success(res, 200, 'Category deleted successfully');
  }

  /**
   * Get popular categories
   * GET /api/categories/popular
   */
  static async getPopularCategories(req, res) {
    const { limit = 10 } = req.query;

    const categories = await Category.getPopular(parseInt(limit));

    return ApiResponse.success(res, 200, 'Popular categories fetched successfully', {
      categories
    });
  }

  /**
   * Get categories by task type
   * GET /api/categories/by-task/:taskType
   */
  static async getCategoriesByTaskType(req, res) {
    const { taskType } = req.params;

    const categories = await Category.getByTaskType(taskType);

    return ApiResponse.success(res, 200, 'Categories fetched successfully', {
      taskType,
      count: categories.length,
      categories
    });
  }

  /**
   * Get category tree (hierarchical)
   * GET /api/categories/tree
   */
  static async getCategoryTree(req, res) {
    // Get root categories
    const rootCategories = await Category.find({ parent: null, isActive: true })
      .sort({ name: 1 });

    // Build tree
    const tree = [];
    for (const root of rootCategories) {
      const children = await Category.find({ parent: root._id, isActive: true })
        .sort({ name: 1 });
      
      tree.push({
        ...root.toObject(),
        children
      });
    }

    return ApiResponse.success(res, 200, 'Category tree fetched successfully', {
      tree
    });
  }
}

module.exports = CategoryController;