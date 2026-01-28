

const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const { protect } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * All routes require authentication
 */
router.use(protect);

/**
 * Project CRUD Operations
 */

// Create project
router.post(
  '/',
  Validator.requireFields(['name']),
  asyncHandler(ProjectController.createProject)
);

// Get all projects
router.get(
  '/',
  asyncHandler(ProjectController.getProjects)
);

// Get single project
router.get(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(ProjectController.getProject)
);

// Update project
router.put(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(ProjectController.updateProject)
);

// Delete project
router.delete(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(ProjectController.deleteProject)
);

/**
 * Project-specific operations
 */

// Get project statistics
router.get(
  '/:id/stats',
  Validator.validateObjectId('id'),
  asyncHandler(ProjectController.getProjectStats)
);

// Update content rules
router.put(
  '/:id/rules',
  Validator.validateObjectId('id'),
  Validator.requireFields(['contentRules']),
  asyncHandler(ProjectController.updateContentRules)
);

// Get project content
router.get(
  '/:id/content',
  Validator.validateObjectId('id'),
  asyncHandler(ProjectController.getProjectContent)
);

// Duplicate project
router.post(
  '/:id/duplicate',
  Validator.validateObjectId('id'),
  asyncHandler(ProjectController.duplicateProject)
);

module.exports = router;