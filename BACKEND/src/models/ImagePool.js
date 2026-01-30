

const mongoose = require('mongoose');

const imagePoolSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
    index: true
  },
  // Image details
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  // Image metadata
  mimeType: {
    type: String
  },
  size: {
    type: Number // in bytes
  },
  dimensions: {
    width: Number,
    height: Number
  },
  // Image type
  imageType: {
    type: String,
    enum: ['logo', 'pool', 'homepage', 'general'],
    default: 'general'
  },
  // Tags for organization
  tags: [{
    type: String,
    trim: true
  }],
  // Usage tracking
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
imagePoolSchema.index({ userId: 1, projectId: 1 });
imagePoolSchema.index({ imageType: 1 });
imagePoolSchema.index({ tags: 1 });

// Method to increment usage
imagePoolSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  await this.save();
};

// Static method to get random images
imagePoolSchema.statics.getRandomImages = function(userId, count = 1, imageType = null) {
  const query = { userId, isActive: true };
  if (imageType) {
    query.imageType = imageType;
  }
  
  return this.aggregate([
    { $match: query },
    { $sample: { size: count } }
  ]);
};

// Static method to get images by project
imagePoolSchema.statics.getProjectImages = function(projectId, imageType = null) {
  const query = { projectId, isActive: true };
  if (imageType) {
    query.imageType = imageType;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

const ImagePool = mongoose.model('ImagePool', imagePoolSchema);

module.exports = ImagePool;