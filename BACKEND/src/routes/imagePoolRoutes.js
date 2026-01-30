

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ImagePoolController = require('../controllers/imagePoolController');
const { protect } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files are allowed (jpg, jpeg, png, gif, webp)'), false);
  }
};

const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per image
  }
});

// All routes require authentication
router.use(protect);

/**
 * Image Pool Management
 */

// Upload images
router.post(
  '/upload',
  uploadImages.array('images', 10), // Max 10 images at once
  asyncHandler(ImagePoolController.uploadImages)
);

// Get all images
router.get(
  '/',
  asyncHandler(ImagePoolController.getImages)
);

// Get random images
router.get(
  '/random',
  asyncHandler(ImagePoolController.getRandomImages)
);

// Get image statistics
router.get(
  '/stats',
  asyncHandler(ImagePoolController.getImageStats)
);

// Get project images
router.get(
  '/project/:projectId',
  Validator.validateObjectId('projectId'),
  asyncHandler(ImagePoolController.getProjectImages)
);

// Get single image
router.get(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(ImagePoolController.getImage)
);

// Update image metadata
router.put(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(ImagePoolController.updateImage)
);

// Delete image
router.delete(
  '/:id',
  Validator.validateObjectId('id'),
  asyncHandler(ImagePoolController.deleteImage)
);

// Bulk delete images
router.post(
  '/bulk-delete',
  Validator.requireFields(['imageIds']),
  asyncHandler(ImagePoolController.bulkDeleteImages)
);

module.exports = router;