

const User = require('../models/User');
const OTP = require('../models/OTP');
const JWTService = require('../services/jwtService');
const emailService = require('../services/emailService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { generateOTP } = require('../utils/helpers');
const { OTP_CONFIG } = require('../config/constants');

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req, res) {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate tokens
    const tokens = JWTService.generateTokenPair(user);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Send welcome email (optional, doesn't throw error)
    emailService.sendWelcomeEmail(email, name).catch(console.error);

    return ApiResponse.created(res, 'User registered successfully', {
      user: user.getPublicProfile(),
      tokens
    });
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res) {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated');
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const tokens = JWTService.generateTokenPair(user);

    // Save refresh token and update last login
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return ApiResponse.success(res, 200, 'Login successful', {
      user: user.getPublicProfile(),
      tokens
    });
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refresh(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token is required');
    }

    // Verify refresh token
    const decoded = JWTService.verifyRefreshToken(refreshToken);

    // Find user and verify stored refresh token
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('User account is deactivated');
    }

    // Generate new tokens
    const tokens = JWTService.generateTokenPair(user);

    // Update stored refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return ApiResponse.success(res, 200, 'Token refreshed successfully', {
      tokens
    });
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    const user = req.user;

    // Clear refresh token
    user.refreshToken = null;
    await user.save();

    return ApiResponse.success(res, 200, 'Logout successful');
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getMe(req, res) {
    return ApiResponse.success(res, 200, 'Profile fetched successfully', {
      user: req.user.getPublicProfile()
    });
  }

  /**
   * Forgot password - Send OTP
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res) {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (security)
      return ApiResponse.success(res, 200, 'If the email exists, an OTP has been sent');
    }

    // Delete any existing OTPs for this user
    await OTP.deleteMany({ userId: user._id, type: 'password_reset' });

    // Generate OTP
    const otp = generateOTP(OTP_CONFIG.LENGTH);

    // Save OTP
    await OTP.create({
      userId: user._id,
      email: user.email,
      otp,
      type: 'password_reset'
    });

    // Send OTP via email
    await emailService.sendOTP(email, otp, user.name);

    return ApiResponse.success(res, 200, 'OTP sent to your email');
  }

  /**
   * Verify OTP
   * POST /api/auth/verify-otp
   */
  static async verifyOTP(req, res) {
    const { email, otp } = req.body;

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      type: 'password_reset',
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return ApiResponse.success(res, 200, 'OTP verified successfully', {
      otpId: otpRecord._id
    });
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res) {
    const { email, otp, newPassword } = req.body;

    // Find verified OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      type: 'password_reset',
      verified: true,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!otpRecord) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    // Update password
    const user = await User.findById(otpRecord.userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.password = newPassword;
    user.refreshToken = null; // Invalidate all sessions
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    return ApiResponse.success(res, 200, 'Password reset successfully');
  }

  /**
   * Change password (for logged-in users)
   * POST /api/auth/change-password
   */
  static async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    user.refreshToken = null; // Invalidate all sessions
    await user.save();

    return ApiResponse.success(res, 200, 'Password changed successfully');
  }
}

module.exports = AuthController;