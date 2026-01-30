

const ImagePool = require('../models/ImagePool');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const path = require('path');

class ImagePoolController {
  /**
   * Upload images to pool
   * POST /api/image-pool/upload
   */
  static async uploadImages(req, res) {
    const userId = req.user._id;
    const { projectId, imageType, tags } = req.body;

    if (!req.files || req.files.length === 0) {
      throw ApiError.badRequest('No images uploaded');
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const imageUrl = `${process.env.BASE_URL}/uploads/${file.filename}`;
      
      const image = await ImagePool.create({
        userId,
        projectId: projectId || null,
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        url: imageUrl,
        mimeType: file.mimetype,
        size: file.size,
        imageType: imageType || 'general',
        tags: tags ? tags.split(',').map(t => t.trim()) : []
      });

      uploadedImages.push(image);
    }

    return ApiResponse.created(res, 'Images uploaded successfully', {
      count: uploadedImages.length,
      images: uploadedImages
    });
  }

  /**
   * Get images from pool
   * GET /api/image-pool
   */
  static async getImages(req, res) {
    const userId = req.user._id;
    const { projectId, imageType, tags, page = 1, limit = 20 } = req.query;

    const query = { userId, isActive: true };
    
    if (projectId) query.projectId = projectId;
    if (imageType) query.imageType = imageType;
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }

    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      ImagePool.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ImagePool.countDocuments(query)
    ]);

    return ApiResponse.success(res, 200, 'Images fetched successfully', {
      images,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  /**
   * Get random images
   * GET /api/image-pool/random
   */
  static async getRandomImages(req, res) {
    const userId = req.user._id;
    const { count = 1, imageType } = req.query;

    const images = await ImagePool.getRandomImages(
      userId,
      parseInt(count),
      imageType || null
    );

    return ApiResponse.success(res, 200, 'Random images fetched successfully', {
      count: images.length,
      images
    });
  }

  /**
   * Get single image
   * GET /api/image-pool/:id
   */
  static async getImage(req, res) {
    const { id } = req.params;
    const userId = req.user._id;

    const image = await ImagePool.findOne({ _id: id, userId });
    if (!image) {
      throw ApiError.notFound('Image not found');
    }

    return ApiResponse.success(res, 200, 'Image fetched successfully', {
      image
    });
  }

  /**
   * Update image metadata
   * PUT /api/image-pool/:id
   */
  static async updateImage(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const { imageType, tags, isActive } = req.body;

    const updates = {};
    if (imageType) updates.imageType = imageType;
    if (tags) updates.tags = tags.split(',').map(t => t.trim());
    if (isActive !== undefined) updates.isActive = isActive;

    const image = await ImagePool.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    );

    if (!image) {
      throw ApiError.notFound('Image not found');
    }

    return ApiResponse.success(res, 200, 'Image updated successfully', {
      image
    });
  }

  /**
   * Delete image
   * DELETE /api/image-pool/:id
   */
  static async deleteImage(req, res) {
    const { id } = req.params;
    const userId = req.user._id;

    const image = await ImagePool.findOne({ _id: id, userId });
    if (!image) {
      throw ApiError.notFound('Image not found');
    }

    // Delete file from disk
    try {
      if (fs.existsSync(image.path)) {
        fs.unlinkSync(image.path);
      }
    } catch (error) {
      console.error('File deletion error:', error);
    }

    // Delete from database
    await ImagePool.deleteOne({ _id: id });

    return ApiResponse.success(res, 200, 'Image deleted successfully');
  }

  /**
   * Get project images
   * GET /api/image-pool/project/:projectId
   */
  static async getProjectImages(req, res) {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { imageType } = req.query;

    const images = await ImagePool.getProjectImages(projectId, imageType || null);

    return ApiResponse.success(res, 200, 'Project images fetched successfully', {
      projectId,
      count: images.length,
      images
    });
  }

  /**
   * Bulk delete images
   * POST /api/image-pool/bulk-delete
   */
  static async bulkDeleteImages(req, res) {
    const { imageIds } = req.body;
    const userId = req.user._id;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      throw ApiError.badRequest('imageIds array is required');
    }

    const images = await ImagePool.find({
      _id: { $in: imageIds },
      userId
    });

    // Delete files from disk
    for (const image of images) {
      try {
        if (fs.existsSync(image.path)) {
          fs.unlinkSync(image.path);
        }
      } catch (error) {
        console.error('File deletion error:', error);
      }
    }

    // Delete from database
    const result = await ImagePool.deleteMany({
      _id: { $in: imageIds },
      userId
    });

    return ApiResponse.success(res, 200, 'Images deleted successfully', {
      deletedCount: result.deletedCount
    });
  }

  /**
   * Get image statistics
   * GET /api/image-pool/stats
   */
  static async getImageStats(req, res) {
    const userId = req.user._id;

    const stats = await ImagePool.aggregate([
      { $match: { userId: userId, isActive: true } },
      {
        $group: {
          _id: '$imageType',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' }
        }
      }
    ]);

    const totalImages = await ImagePool.countDocuments({ userId, isActive: true });
    const totalSize = await ImagePool.aggregate([
      { $match: { userId: userId, isActive: true } },
      { $group: { _id: null, total: { $sum: '$size' } } }
    ]);

    return ApiResponse.success(res, 200, 'Image statistics fetched successfully', {
      totalImages,
      totalSizeBytes: totalSize[0]?.total || 0,
      totalSizeMB: ((totalSize[0]?.total || 0) / (1024 * 1024)).toFixed(2),
      byType: stats
    });
  }
}

module.exports = ImagePoolController;