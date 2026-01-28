

const mongoose = require('mongoose');
const { TASK_TYPES } = require('../config/constants');

const postingSiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: Object.values(TASK_TYPES),
    required: true,
    index: true
  },
  
  // Site credentials (encrypted in production)
  credentials: {
    username: String,
    password: String,
    apiKey: String
  },
  
  // Required fields for submission
  requiredFields: [{
    type: String,
    trim: true
  }],
  
  // Site status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    successfulSubmissions: {
      type: Number,
      default: 0
    },
    failedSubmissions: {
      type: Number,
      default: 0
    },
    lastSubmissionAt: Date
  },
  
  // Site metadata
  domainAuthority: Number,
  pageAuthority: Number,
  notes: String
  
}, {
  timestamps: true
});

// Index for efficient queries
postingSiteSchema.index({ category: 1, isActive: 1 });

// Static method to get sites by category
postingSiteSchema.statics.getByCategoryAndActive = function(category) {
  return this.find({ category, isActive: true });
};

// Method to increment stats
postingSiteSchema.methods.incrementStats = async function(success = true) {
  this.stats.totalSubmissions += 1;
  if (success) {
    this.stats.successfulSubmissions += 1;
  } else {
    this.stats.failedSubmissions += 1;
  }
  this.stats.lastSubmissionAt = new Date();
  await this.save();
};

const PostingSite = mongoose.model('PostingSite', postingSiteSchema);

module.exports = PostingSite;