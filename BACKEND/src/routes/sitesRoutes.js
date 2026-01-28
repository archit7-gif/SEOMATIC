
const express = require('express');
const router = express.Router();
const SitesController = require('../controllers/sitesController');
const { protect, restrictTo } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');

// All routes require authentication
router.use(protect);

// Create site (admin only)
router.post(
  '/',
  restrictTo('admin'),
  Validator.requireFields(['name', 'url', 'category']),
  asyncHandler(SitesController.createSite)
);

// Get all sites (all logged-in users)
router.get(
  '/',
  asyncHandler(SitesController.getSites)
);

// Get single site (all logged-in users)
router.get(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(SitesController.getSite)
);

// Update site (admin only)
router.put(
  '/:id',
  restrictTo('admin'),
  Validator.validateObjectId('id'),
  asyncHandler(SitesController.updateSite)
);

// Delete site (admin only)
router.delete(
  '/:id',
  restrictTo('admin'),
  Validator.validateObjectId('id'),
  asyncHandler(SitesController.deleteSite)
);

// Get sites by category (all logged-in users)
router.get(
  '/category/:category',
  asyncHandler(SitesController.getSitesByCategory)
);

module.exports = router;
