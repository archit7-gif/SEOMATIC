

const Project = require('../models/Project');
const ContentItem = require('../models/ContentItem');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class ProjectController {
  /**
   * Create new project
   * POST /api/projects
   */
  static async createProject(req, res) {
    const userId = req.user._id;
    const { name, description, contentRules } = req.body;

    // Create project
    const project = await Project.create({
      userId,
      name,
      description,
      contentRules: contentRules || {}
    });

    return ApiResponse.created(res, 'Project created successfully', {
      project: project.getSummary()
    });
  }

  /**
   * Get all projects for user
   * GET /api/projects
   */
  static async getProjects(req, res) {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Project.countDocuments(query)
    ]);

    return ApiResponse.success(res, 200, 'Projects fetched successfully', {
      projects,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  /**
   * Get single project by ID
   * GET /api/projects/:id
   */
  static async getProject(req, res) {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({ _id: id, userId });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    return ApiResponse.success(res, 200, 'Project fetched successfully', {
      project
    });
  }

  /**
   * Update project
   * PUT /api/projects/:id
   */
  static async updateProject(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    // Don't allow updating userId or stats
    delete updates.userId;
    delete updates.stats;

    const project = await Project.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    return ApiResponse.success(res, 200, 'Project updated successfully', {
      project: project.getSummary()
    });
  }

  /**
   * Delete project
   * DELETE /api/projects/:id
   */
  static async deleteProject(req, res) {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({ _id: id, userId });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Delete all associated content items
    await ContentItem.deleteMany({ projectId: id });

    // Delete project
    await Project.deleteOne({ _id: id });

    return ApiResponse.success(res, 200, 'Project and all associated content deleted successfully');
  }

  /**
   * Get project statistics
   * GET /api/projects/:id/stats
   */
  static async getProjectStats(req, res) {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({ _id: id, userId });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Update stats
    await project.updateStats();

    // Get detailed stats by task type
    const contentStats = await ContentItem.getProjectStats(id);

    return ApiResponse.success(res, 200, 'Project statistics fetched successfully', {
      projectStats: project.stats,
      contentByTaskType: contentStats
    });
  }

  /**
   * Update project content rules
   * PUT /api/projects/:id/rules
   */
  static async updateContentRules(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const { contentRules } = req.body;

    if (!contentRules) {
      throw ApiError.badRequest('Content rules are required');
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, userId },
      { $set: { contentRules } },
      { new: true, runValidators: true }
    );

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    return ApiResponse.success(res, 200, 'Content rules updated successfully', {
      contentRules: project.contentRules
    });
  }

  /**
   * Get all content items for a project
   * GET /api/projects/:id/content
   */
  static async getProjectContent(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const { taskType, status, page = 1, limit = 20 } = req.query;

    // Verify project belongs to user
    const project = await Project.findOne({ _id: id, userId });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const query = { projectId: id };
    
    if (taskType) {
      query.taskType = taskType;
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [content, total] = await Promise.all([
      ContentItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ContentItem.countDocuments(query)
    ]);

    return ApiResponse.success(res, 200, 'Project content fetched successfully', {
      content,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  /**
   * Duplicate project
   * POST /api/projects/:id/duplicate
   */
  static async duplicateProject(req, res) {
    const { id } = req.params;
    const userId = req.user._id;

    const originalProject = await Project.findOne({ _id: id, userId });

    if (!originalProject) {
      throw ApiError.notFound('Project not found');
    }

    // Create duplicate
    const duplicateData = originalProject.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    delete duplicateData.stats;
    delete duplicateData.completedAt;
    
    duplicateData.name = `${originalProject.name} (Copy)`;
    duplicateData.status = 'draft';

    const newProject = await Project.create(duplicateData);

    return ApiResponse.created(res, 'Project duplicated successfully', {
      project: newProject.getSummary()
    });
  }
}

module.exports = ProjectController;