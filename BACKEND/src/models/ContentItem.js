

const mongoose = require('mongoose');
const { CONTENT_STATUS, TASK_TYPES } = require('../config/constants');

const contentItemSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  taskType: {
    type: String,
    enum: Object.values(TASK_TYPES),
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  
  keywords: [{
    type: String,
    trim: true
  }],
  targetLink: {
    type: String,
    required: true,
    trim: true
  },
  
  wordLimit: {
    type: Number,
    min: 50,
    max: 5000
  },
  actualWordCount: {
    type: Number
  },
  
  status: {
    type: String,
    enum: Object.values(CONTENT_STATUS),
    default: CONTENT_STATUS.PENDING,
    index: true
  },
  
  generationMetadata: {
    attemptCount: {
      type: Number,
      default: 0
    },
    generatedAt: {
      type: Date
    },
    aiModel: {
      type: String,
      default: 'gemini'
    },
    processingTime: {
      type: Number
    }
  },
  
  sourceData: {
    rowNumber: {
      type: Number
    },
    originalTitle: {
      type: String
    },
    originalDescription: {
      type: String
    }
  },
  
  error: {
    message: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Indexes
contentItemSchema.index({ projectId: 1, status: 1 });
contentItemSchema.index({ projectId: 1, taskType: 1 });
contentItemSchema.index({ userId: 1, createdAt: -1 });

// Count words
contentItemSchema.methods.countWords = function() {
  if (!this.body) return 0;
  return this.body.trim().split(/\s+/).length;
};

// Pre-save hook
contentItemSchema.pre('save', function(next) {
  try {
    if (this.isModified('body')) {
      this.actualWordCount = this.countWords();
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Mark as generated
contentItemSchema.methods.markAsGenerated = async function() {
  this.status = CONTENT_STATUS.GENERATED;
  this.generationMetadata.generatedAt = new Date();
  return this.save();
};

// Mark as failed
contentItemSchema.methods.markAsFailed = async function(errorMessage) {
  this.status = CONTENT_STATUS.FAILED;
  this.error = {
    message: errorMessage,
    timestamp: new Date()
  };
  return this.save();
};

// Get content by task type
contentItemSchema.statics.getByTaskType = function(projectId, taskType) {
  return this.find({ 
    projectId, 
    taskType,
    status: { $ne: CONTENT_STATUS.FAILED }
  });
};

// Get project stats
contentItemSchema.statics.getProjectStats = async function(projectId) {
  return this.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$taskType',
        count: { $sum: 1 },
        generated: {
          $sum: { $cond: [{ $eq: ['$status', CONTENT_STATUS.GENERATED] }, 1, 0] }
        },
        published: {
          $sum: { $cond: [{ $eq: ['$status', CONTENT_STATUS.PUBLISHED] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', CONTENT_STATUS.FAILED] }, 1, 0] }
        },
        avgWordCount: { $avg: '$actualWordCount' }
      }
    }
  ]);
};

const ContentItem = mongoose.model('ContentItem', contentItemSchema);

module.exports = ContentItem;
