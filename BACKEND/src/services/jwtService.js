

const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

class JWTService {
  /**
   * Generate access token
   * @param {object} payload - Data to encode in token
   * @returns {string} - JWT token
   */
  static generateAccessToken(payload) {
    try {
      return jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
      );
    } catch (error) {
      throw ApiError.internal('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   * @param {object} payload - Data to encode in token
   * @returns {string} - JWT token
   */
  static generateRefreshToken(payload) {
    try {
      return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
      );
    } catch (error) {
      throw ApiError.internal('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param {object} user - User object
   * @returns {object} - { accessToken, refreshToken }
   */
  static generateTokenPair(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * Verify access token
   * @param {string} token - JWT token
   * @returns {object} - Decoded payload
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Access token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw ApiError.unauthorized('Invalid access token');
      }
      throw ApiError.unauthorized('Token verification failed');
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT token
   * @returns {object} - Decoded payload
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Refresh token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw ApiError.unauthorized('Invalid refresh token');
      }
      throw ApiError.unauthorized('Token verification failed');
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token
   * @returns {object} - Decoded payload
   */
  static decode(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTService;