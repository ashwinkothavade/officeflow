/**
 * Custom error class for consistent error responses
 */
class ErrorResponse extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a new ErrorResponse instance from an error object
   */
  static fromError(error: Error, statusCode: number = 500) {
    const errorResponse = new ErrorResponse(error.message, statusCode);
    errorResponse.stack = error.stack;
    return errorResponse;
  }
}

export default ErrorResponse;
