import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { ErrorResponse, IValidationError } from './errorHandler';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages: IValidationError[] = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : '',
      message: err.msg
    }));

    next(ErrorResponse.badRequest('Validation failed', errorMessages));
  };
};

export const validationRules = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  login: [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  expense: [
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('amount')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Amount must be greater than 0'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('notes').optional().isString(),
    body('receipt').optional().isString(),
    body('status').optional().isIn(['pending', 'approved', 'rejected'])
  ]
};
