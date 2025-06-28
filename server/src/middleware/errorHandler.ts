import { Request, Response, NextFunction } from 'express';

export interface IValidationError {
  field: string;
  message: string;
}

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error details
  console.error('Error:', {
    message: err.message,
    name: err.name,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: IValidationError[] = [];

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.entries(err.errors).map(([field, error]: [string, any]) => ({
      field,
      message: error.message
    }));
  } else if (err.name === 'MongoError' && err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 400;
    message = 'Duplicate key error';
    const field = Object.keys(err.keyPattern)[0];
    errors = [{
      field,
      message: `${field} already exists`
    }];
  } else if (err.name === 'CastError') {
    // Invalid ID format
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.statusCode) {
    // Custom error with status code
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const ErrorResponse = (message: string, statusCode: number, errors: IValidationError[] = []) => {
  return {
    success: false,
    error: message,
    statusCode,
    errors
  };
};

export { errorHandler,ErrorResponse };
