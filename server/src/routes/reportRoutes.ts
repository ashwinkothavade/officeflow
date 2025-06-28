import { Router } from 'express';
import { generateExpenseReport, exportExpensesToCSV } from '../controllers/reportController';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

// Generate expense report
router.get('/expenses', asyncHandler(generateExpenseReport));

// Export expenses to CSV
router.get('/expenses/export', asyncHandler(exportExpensesToCSV));

export default router;
