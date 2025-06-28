import { Router } from 'express';
import { 
  getExpenses, 
  getExpense, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  getExpenseSummary,
  updateExpenseStatus,
  ExpenseRequest
} from '../controllers/expenseController';
import { validate, validationRules } from '../middleware/validation';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

// Routes - no authentication required
router.route('/')
  .get(asyncHandler<ExpenseRequest>(getExpenses))
  .post(validate(validationRules.expense), asyncHandler<ExpenseRequest>(createExpense));

// Summary endpoint
router.get('/summary', asyncHandler<ExpenseRequest>(getExpenseSummary));

// Single expense operations
router.route('/:id')
  .get(asyncHandler<ExpenseRequest>(getExpense))
  .put(validate(validationRules.expense), asyncHandler<ExpenseRequest>(updateExpense))
  .delete(asyncHandler<ExpenseRequest>(deleteExpense));

// Status update route
router.patch('/:id/status', asyncHandler<ExpenseRequest>(updateExpenseStatus));

export default router;
