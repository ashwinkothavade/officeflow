import { Request, Response, NextFunction } from 'express';

export interface IValidationError {
  field: string;
  message: string;
}

export class ErrorResponse extends Error {
  statusCode: number;
  errors?: IValidationError[];
  
  constructor(message: string, statusCode: number, errors?: IValidationError[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ErrorResponse.prototype);
  }

  static badRequest(message: string, errors?: IValidationError[]) {
    return new ErrorResponse(message, 400, errors);
  }

  static unauthorized(message = 'Not authorized') {
    return new ErrorResponse(message, 401);
  }

  static notFound(message = 'Resource not found') {
    return new ErrorResponse(message, 404);
  }

  static serverError(message = 'Server Error') {
    return new ErrorResponse(message, 500);
  }
}

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    name: err.name,
    code: err.code,
  });

  // Handle different types of errors
  switch (err.name) {
    case 'CastError':
      error = ErrorResponse.notFound('Resource not found');
      break;
    case 'ValidationError':
      const validationErrors = Object.values(err.errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      }));
      error = ErrorResponse.badRequest('Validation failed', validationErrors);
      break;
    case 'JsonWebTokenError':
      error = ErrorResponse.unauthorized('Not authorized, token failed');
      break;
    case 'TokenExpiredError':
      error = ErrorResponse.unauthorized('Token has expired');
      break;
    default:
      // Handle duplicate key error
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = ErrorResponse.badRequest(
          `Duplicate field value: ${field} already exists`,
          [{ field, message: `${field} must be unique` }]
        );
      } else if (!(err instanceof ErrorResponse)) {
        // If it's not one of our custom errors
        error = ErrorResponse.serverError(err.message || 'Server Error');
      } else {
        error = err;
      }
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message,
    errors: (error as ErrorResponse).errors,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

export { errorHandler };
