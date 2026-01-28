

const mongoose = require('mongoose');
const { OTP_CONFIG } = require('../config/constants');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['password_reset', 'email_verification'],
    default: 'password_reset'
  },
  verified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete after expiration
  }
}, {
  timestamps: true
});

// Set expiration time before saving
otpSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    const expiryMinutes = OTP_CONFIG.EXPIRY_MINUTES;
    this.expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  }
  next();
});

// Index for faster lookups
otpSchema.index({ email: 1, otp: 1 });
otpSchema.index({ userId: 1 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;