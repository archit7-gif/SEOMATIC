

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // For task type mapping
  taskTypes: [{
    type: String
  }],
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index
categorySchema.index({ parent: 1 });

// Method to increment usage
categorySchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  await this.save();
};

// Static method to get popular categories
categorySchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1 })
    .limit(limit);
};

// Static method to get categories by task type
categorySchema.statics.getByTaskType = function(taskType) {
  return this.find({
    taskTypes: taskType,
    isActive: true
  });
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;