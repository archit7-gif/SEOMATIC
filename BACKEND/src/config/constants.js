


// Application-wide constants

// Task Types (SEO Backlink Types)
const TASK_TYPES = {
  CLASSIFIED: 'classified',
  PROFILE: 'profile',
  GUEST_POSTING: 'guest_posting',
  BUSINESS_LISTING: 'business_listing',
  BLOG_COMMENTING: 'blog_commenting',
  SOCIAL_BOOKMARKING: 'social_bookmarking',
  PDF_SUBMISSION: 'pdf_submission',
  ORG_LINK: 'org_link',
  NET_LINK: 'net_link',
  INFO_LINK: 'info_link'
};

// Content Moods/Tones
const CONTENT_MOODS = {
  INFORMATIONAL: 'informational',
  PROMOTIONAL: 'promotional',
  NEUTRAL: 'neutral',
  PROFESSIONAL: 'professional',
  MARKETING: 'marketing'
};

// Title Lengths
const TITLE_LENGTHS = {
  SHORT: 'short',
  MEDIUM: 'medium',
  LONG: 'long'
};

// Project Status
const PROJECT_STATUS = {
  DRAFT: 'draft',
  CONTENT_GENERATED: 'content_generated',
  POSTING_IN_PROGRESS: 'posting_in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Content Status
const CONTENT_STATUS = {
  PENDING: 'pending',
  GENERATED: 'generated',
  PUBLISHED: 'published',
  FAILED: 'failed'
};

// Publish Status
const PUBLISH_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending'
};

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// Content Sources
const CONTENT_SOURCES = {
  FULL_GPT: 'full_gpt',
  MIXED: 'mixed',
  EXCEL_BASED: 'excel_based'
};

// Languages (common ones)
const LANGUAGES = [
  'english',
  'spanish',
  'french',
  'german',
  'hindi',
  'chinese',
  'japanese',
  'arabic'
];

// File upload limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['xlsx', 'xls']
};

// OTP Configuration
const OTP_CONFIG = {
  LENGTH: parseInt(process.env.OTP_LENGTH) || 6,
  EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10
};

module.exports = {
  TASK_TYPES,
  CONTENT_MOODS,
  TITLE_LENGTHS,
  PROJECT_STATUS,
  CONTENT_STATUS,
  PUBLISH_STATUS,
  USER_ROLES,
  CONTENT_SOURCES,
  LANGUAGES,
  UPLOAD_LIMITS,
  OTP_CONFIG
};