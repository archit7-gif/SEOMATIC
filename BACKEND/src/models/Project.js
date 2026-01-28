

const mongoose = require('mongoose');
const { 
  PROJECT_STATUS, 
  CONTENT_MOODS, 
  TITLE_LENGTHS, 
  LANGUAGES,
  CONTENT_SOURCES 
} = require('../config/constants');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: Object.values(PROJECT_STATUS),
    default: PROJECT_STATUS.DRAFT
  },
  
  // Content Generation Rules
  contentRules: {
    // Keyword Settings
    keywordsPerArticle: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    keywordReuse: {
      type: Boolean,
      default: true
    },
    
    // Content Mood/Tone
    contentMood: {
      type: String,
      enum: Object.values(CONTENT_MOODS),
      default: CONTENT_MOODS.INFORMATIONAL
    },
    
    // Content Structure
    wordsPerParagraph: {
      type: Number,
      default: 100,
      min: 50,
      max: 300
    },
    contentDepth: {
      type: String,
      enum: ['shallow', 'medium', 'deep'],
      default: 'medium'
    },
    includeConclusion: {
      type: Boolean,
      default: true
    },
    
    // Language & Title
    language: {
      type: String,
      default: 'english'
    },
    titleLength: {
      type: String,
      enum: Object.values(TITLE_LENGTHS),
      default: TITLE_LENGTHS.MEDIUM
    },
    
    // Content Source
    contentSource: {
      type: String,
      enum: Object.values(CONTENT_SOURCES),
      default: CONTENT_SOURCES.MIXED
    },
    
    // Formatting Options
    formatting: {
      useBulletPoints: {
        type: Boolean,
        default: true
      },
      useTables: {
        type: Boolean,
        default: false
      },
      useEmojis: {
        type: Boolean,
        default: false
      },
      useBoxes: {
        type: Boolean,
        default: false
      },
      useQuotes: {
        type: Boolean,
        default: true
      },
      includeFAQ: {
        type: Boolean,
        default: false
      }
    },
    
    // Brand/Domain Settings
    brandSettings: {
      includeBrand: {
        type: Boolean,
        default: false
      },
      brandName: {
        type: String,
        trim: true
      },
      domainName: {
        type: String,
        trim: true
      }
    },
    
    // Additional AI Instructions
    customInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Custom instructions cannot exceed 1000 characters']
    }
  },
  
  // Statistics
  stats: {
    totalContentItems: {
      type: Number,
      default: 0
    },
    generatedItems: {
      type: Number,
      default: 0
    },
    publishedItems: {
      type: Number,
      default: 0
    },
    failedItems: {
      type: Number,
      default: 0
    }
  },
  
  // Excel file reference
  excelFile: {
    originalName: String,
    filename: String,
    path: String,
    uploadedAt: Date
  },
  
  // Completion tracking
  completedAt: {
    type: Date
  }
  
}, {
  timestamps: true
});

// Index for faster queries
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ createdAt: -1 });

// Method to update statistics
projectSchema.methods.updateStats = async function() {
  const ContentItem = mongoose.model('ContentItem');
  
  const stats = await ContentItem.aggregate([
    { $match: { projectId: this._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        generated: {
          $sum: { $cond: [{ $eq: ['$status', 'generated'] }, 1, 0] }
        },
        published: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.stats = {
      totalContentItems: stats[0].total,
      generatedItems: stats[0].generated,
      publishedItems: stats[0].published,
      failedItems: stats[0].failed
    };
    await this.save();
  }
};

// Method to get project summary
projectSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    status: this.status,
    stats: this.stats,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;