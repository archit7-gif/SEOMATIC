
const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');

// All routes require authentication
router.use(protect);

// Generate and download report
router.get(
  '/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(ReportController.generateReport)
);

// Get report summary
router.get(
  '/summary/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(ReportController.getSummary)
);

// Get all backlinks
router.get(
  '/backlinks/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(ReportController.getBacklinks)
);

module.exports = router;