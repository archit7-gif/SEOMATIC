

const express = require('express');
const router = express.Router();
const PostingController = require('../controllers/postingController');
const { protect } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');

// All routes require authentication
router.use(protect);

// Publish single content to site
router.post(
  '/publish-single',
  Validator.requireFields(['contentId', 'siteId']),
  asyncHandler(PostingController.publishSingle)
);

// Publish bulk (multiple content to multiple sites)
router.post(
  '/publish-bulk',
  Validator.requireFields(['contentIds', 'siteIds']),
  asyncHandler(PostingController.publishBulk)
);

// Auto-publish project (smart matching)
router.post(
  '/auto-publish',
  Validator.requireFields(['projectId']),
  asyncHandler(PostingController.autoPublish)
);

// Get publish results
router.get(
  '/results/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(PostingController.getResults)
);

// Get publishing stats
router.get(
  '/stats/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(PostingController.getStats)
);

// Retry failed publications
router.post(
  '/retry',
  Validator.requireFields(['projectId']),
  asyncHandler(PostingController.retryFailed)
);

module.exports = router;