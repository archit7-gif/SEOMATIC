

const JWTService = require('../services/jwtService');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('./asyncHandler');

/**
 * Protect routes - Verify JWT token
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Access token is required');
  }

  // Verify token
  const decoded = JWTService.verifyAccessToken(token);

  // Get user from token
  const user = await User.findById(decoded.id).select('-password -refreshToken');

  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('User account is deactivated');
  }

  // Attach user to request
  req.user = user;
  next();
});

/**
 * Restrict to specific roles
 * @param  {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }

    next();
  };
};

/**
 * Optional auth - Doesn't fail if no token
 * Useful for routes that work both with and without auth
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = JWTService.verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
      console.log('Optional auth failed:', error.message);
    }
  }

  next();
});

module.exports = {
  protect,
  restrictTo,
  optionalAuth
};