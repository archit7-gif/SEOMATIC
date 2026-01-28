

const mongoose = require('mongoose');
const { PUBLISH_STATUS } = require('../config/constants');

const publishResultSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentItem',
    required: true,
    index: true
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostingSite',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Publish result
  status: {
    type: String,
    enum: Object.values(PUBLISH_STATUS),
    default: PUBLISH_STATUS.PENDING,
    index: true
  },
  
  publishedUrl: {
    type: String,
    trim: true
  },
  
  // Error tracking
  errorMessage: String,
  errorDetails: mongoose.Schema.Types.Mixed,
  
  // Metadata
  attemptCount: {
    type: Number,
    default: 1
  },
  publishedAt: Date,
  processingTime: Number // milliseconds
  
}, {
  timestamps: true
});

// Indexes
publishResultSchema.index({ projectId: 1, status: 1 });
publishResultSchema.index({ contentId: 1, siteId: 1 });
publishResultSchema.index({ userId: 1, createdAt: -1 });

// Static method to get project results
publishResultSchema.statics.getProjectResults = function(projectId) {
  return this.find({ projectId })
    .populate('contentId', 'title taskType')
    .populate('siteId', 'name url')
    .sort({ createdAt: -1 });
};

const PublishResult = mongoose.model('PublishResult', publishResultSchema);

module.exports = PublishResult;