

const ApiError = require('../utils/ApiError');
const { isValidEmail } = require('../utils/helpers');

/**
 * Validation Middleware
 * Validates request data and throws ApiError if validation fails
 */

class Validator {
  /**
   * Validate required fields
   * @param {array} requiredFields - Array of field names
   */
  static requireFields(requiredFields) {
    return (req, res, next) => {
      const missingFields = [];
      
      requiredFields.forEach(field => {
        if (!req.body[field]) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        throw ApiError.badRequest(
          'Missing required fields',
          { missingFields }
        );
      }

      next();
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(req, res, next) {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required');
    }

    if (!isValidEmail(email)) {
      throw ApiError.badRequest('Invalid email format');
    }

    next();
  }

  /**
   * Validate password strength
   */
  static validatePassword(req, res, next) {
    const { password } = req.body;

    if (!password) {
      throw ApiError.badRequest('Password is required');
    }

    if (password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters long');
    }

    // Optional: Add more password strength checks
    // if (!/[A-Z]/.test(password)) {
    //   throw ApiError.badRequest('Password must contain at least one uppercase letter');
    // }

    next();
  }

  /**
   * Validate MongoDB ObjectId
   */
  static validateObjectId(paramName = 'id') {
    return (req, res, next) => {
      const id = req.params[paramName];
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;

      if (!objectIdRegex.test(id)) {
        throw ApiError.badRequest(`Invalid ${paramName} format`);
      }

      next();
    };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(allowedTypes = ['xlsx', 'xls']) {
    return (req, res, next) => {
      if (!req.file) {
        throw ApiError.badRequest('File is required');
      }

      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        throw ApiError.badRequest(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        );
      }

      next();
    };
  }

  /**
   * Validate enum values
   */
  static validateEnum(field, allowedValues) {
    return (req, res, next) => {
      const value = req.body[field];

      if (value && !allowedValues.includes(value)) {
        throw ApiError.badRequest(
          `Invalid ${field}. Allowed values: ${allowedValues.join(', ')}`
        );
      }

      next();
    };
  }
}

module.exports = Validator;