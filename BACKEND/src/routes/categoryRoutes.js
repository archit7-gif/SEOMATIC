

const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');

// All routes require authentication
router.use(protect);

/**
 * Category CRUD
 */

// Create category (admin only)
router.post(
  '/',
  restrictTo('admin'),
  Validator.requireFields(['name']),
  asyncHandler(CategoryController.createCategory)
);

// Get all categories
router.get(
  '/',
  asyncHandler(CategoryController.getCategories)
);

// Get category tree
router.get(
  '/tree',
  asyncHandler(CategoryController.getCategoryTree)
);

// Get popular categories
router.get(
  '/popular',
  asyncHandler(CategoryController.getPopularCategories)
);

// Get categories by task type
router.get(
  '/by-task/:taskType',
  asyncHandler(CategoryController.getCategoriesByTaskType)
);

// Get single category
router.get(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(CategoryController.getCategory)
);

// Update category (admin only)
router.put(
  '/:id',
  restrictTo('admin'),
  Validator.validateObjectId('id'),
  asyncHandler(CategoryController.updateCategory)
);

// Delete category (admin only)
router.delete(
  '/:id',
  restrictTo('admin'),
  Validator.validateObjectId('id'),
  asyncHandler(CategoryController.deleteCategory)
);

module.exports = router;