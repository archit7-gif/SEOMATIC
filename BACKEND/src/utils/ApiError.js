

/**
 * Custom API Error Class
 * Extends the native Error class with statusCode
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);

    console.log(this.errors)
  }

  /**
   * Bad Request (400)
   */
  static badRequest(message = 'Bad request', errors = null) {
    return new ApiError(400, message, errors);
  }

  /**
   * Unauthorized (401)
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  /**
   * Forbidden (403)
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  /**
   * Not Found (404)
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  /**
   * Conflict (409)
   */
  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  /**
   * Internal Server Error (500)
   */
  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }

  /**
   * Service Unavailable (503)
   */
  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiError(503, message);
  }
}

module.exports = ApiError;