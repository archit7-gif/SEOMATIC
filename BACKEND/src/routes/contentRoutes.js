

const express = require('express');
const router = express.Router();
const ContentController = require('../controllers/contentController');
const { protect } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');
const upload = require('../config/multer');

/**
 * All routes require authentication
 */
router.use(protect);

/**
 * Content Generation Routes
 */

// Upload Excel file
router.post(
  '/upload',
  upload.single('file'),
  Validator.requireFields(['projectId']),
  Validator.validateFileUpload(['xlsx', 'xls']),
  asyncHandler(ContentController.uploadExcel)
);

// Generate content from Excel
router.post(
  '/generate',
  Validator.requireFields(['projectId']),
  asyncHandler(ContentController.generateContent)
);

/**
 * Content Item Operations
 */

// Get single content item
router.get(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(ContentController.getContent)
);

// Update content item
router.put(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(ContentController.updateContent)
);

// Delete content item
router.delete(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(ContentController.deleteContent)
);

// Regenerate single content item
router.post(
  '/:id/regenerate',
  Validator.validateObjectId('id'),
  asyncHandler(ContentController.regenerateContent)
);

/**
 * Download & Export
 */

// Download generated content as Excel
router.get(
  '/download/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(ContentController.downloadContent)
);

// Get content by task type
router.get(
  '/by-task/:projectId/:taskType',
  Validator.validateObjectId('projectId'),
  asyncHandler(ContentController.getContentByTaskType)
);

module.exports = router;