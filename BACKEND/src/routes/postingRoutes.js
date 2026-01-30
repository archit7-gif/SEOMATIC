const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const { protect } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');
const upload = require('../config/multer');

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
 * ✅ NEW: Project Form Operations
 */

// Upload project form Excel
router.post(
  '/:id/upload-form',
  Validator.validateObjectId('id'),
  upload.single('file'),
  Validator.validateFileUpload(['xlsx', 'xls', 'csv']),
  asyncHandler(ProjectController.uploadProjectForm)
);

// Update project form manually
router.put(
  '/:id/form',
  Validator.validateObjectId('id'),
  Validator.requireFields(['projectForm']),
  asyncHandler(ProjectController.updateProjectForm)
);

// Get project form
router.get(
  '/:id/form',
  Validator.validateObjectId('id'),
  asyncHandler(ProjectController.getProjectForm)
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