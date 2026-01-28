

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const Validator = require('../middlewares/validator');
const asyncHandler = require('../middlewares/asyncHandler');
const rateLimit = require('express-rate-limit');

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per windowMs
  message: 'Too many authentication attempts, please try again later'
});

/**
 * Public Routes (No authentication required)
 */

// Register
router.post(
  '/register',
  authLimiter,
  Validator.requireFields(['name', 'email', 'password']),
  Validator.validateEmail,
  Validator.validatePassword,
  asyncHandler(AuthController.register)
);

// Login
router.post(
  '/login',
  authLimiter,
  Validator.requireFields(['email', 'password']),
  Validator.validateEmail,
  asyncHandler(AuthController.login)
);

// Refresh token
router.post(
  '/refresh',
  Validator.requireFields(['refreshToken']),
  asyncHandler(AuthController.refresh)
);

// Forgot password - Send OTP
router.post(
  '/forgot-password',
  authLimiter,
  Validator.requireFields(['email']),
  Validator.validateEmail,
  asyncHandler(AuthController.forgotPassword)
);

// Verify OTP
router.post(
  '/verify-otp',
  authLimiter,
  Validator.requireFields(['email', 'otp']),
  Validator.validateEmail,
  asyncHandler(AuthController.verifyOTP)
);

// Reset password
router.post(
  '/reset-password',
  authLimiter,
  Validator.requireFields(['email', 'otp', 'newPassword']),
  Validator.validateEmail,
  Validator.validatePassword,
  asyncHandler(AuthController.resetPassword)
);

/**
 * Protected Routes (Authentication required)
 */

// Get current user
router.get(
  '/me',
  protect,
  asyncHandler(AuthController.getMe)
);

// Logout
router.post(
  '/logout',
  protect,
  asyncHandler(AuthController.logout)
);

// Change password
router.post(
  '/change-password',
  protect,
  Validator.requireFields(['currentPassword', 'newPassword']),
  Validator.validatePassword,
  asyncHandler(AuthController.changePassword)
);

module.exports = router;