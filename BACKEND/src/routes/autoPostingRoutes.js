

const express = require('express');
const router = express.Router();
const AutoPostingController = require('../controllers/autoPostingController');
const { protect } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');

// All routes require authentication
router.use(protect);

/**
 * Smart Select & Auto Publishing
 */

// Get smart-matched sites for project content
router.get(
  '/smart-select/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(AutoPostingController.smartSelect)
);

// Auto-publish project with smart matching
router.post(
  '/auto-publish',
  Validator.requireFields(['projectId']),
  asyncHandler(AutoPostingController.autoPublish)
);

// Publish to manually selected sites
router.post(
  '/publish-selected',
  Validator.requireFields(['contentIds', 'siteIds']),
  asyncHandler(AutoPostingController.publishSelected)
);

/**
 * Results & Statistics
 */

// Get publishing statistics
router.get(
  '/stats/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(AutoPostingController.getStats)
);

// Get publish results
router.get(
  '/results/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(AutoPostingController.getResults)
);

// Get successful backlinks only
router.get(
  '/backlinks/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(AutoPostingController.getBacklinks)
);

/**
 * Retry & Management
 */

// Retry failed publications
router.post(
  '/retry',
  Validator.requireFields(['projectId']),
  asyncHandler(AutoPostingController.retryFailed)
);

module.exports = router;