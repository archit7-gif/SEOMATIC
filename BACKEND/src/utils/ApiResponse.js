

/**
 * Standard API Response Utility
 * Ensures consistent response format across the application
 */

class ApiResponse {
  /**
   * Success response
   * @param {object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {any} data - Response data
   */
  static success(res, statusCode = 200, message = 'Success', data = null) {
    const response = {
      success: true,
      message
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   * @param {object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {any} errors - Additional error details
   */
  static error(res, statusCode = 500, message = 'Internal server error', errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors !== null) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Validation error response
   * @param {object} res - Express response object
   * @param {array|object} errors - Validation errors
   */
  static validationError(res, errors) {
    return this.error(res, 400, 'Validation failed', errors);
  }

  /**
   * Not found response
   * @param {object} res - Express response object
   * @param {string} message - Not found message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, 404, message);
  }

  /**
   * Unauthorized response
   * @param {object} res - Express response object
   * @param {string} message - Unauthorized message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, 401, message);
  }

  /**
   * Forbidden response
   * @param {object} res - Express response object
   * @param {string} message - Forbidden message
   */
  static forbidden(res, message = 'Forbidden access') {
    return this.error(res, 403, message);
  }

  /**
   * Created response
   * @param {object} res - Express response object
   * @param {string} message - Created message
   * @param {any} data - Response data
   */
  static created(res, message = 'Resource created successfully', data = null) {
    return this.success(res, 201, message, data);
  }
}

module.exports = ApiResponse;