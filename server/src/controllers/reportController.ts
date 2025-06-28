import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Expense, { IExpense, ExpenseStatus } from '../models/Expense';

interface IReportFilters {
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
  category?: string;
  status?: ExpenseStatus;
  user?: Types.ObjectId;
}

interface IExpenseWithUser extends Omit<IExpense, 'user'> {
  user: {
    name: string;
    email: string;
    _id: Types.ObjectId;
  };
}

/**
 * Generate expense report based on filters
 */
export const generateExpenseReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, category, status, userId } = req.query;
    
    const filters: any = {};
    
    // Date range filter
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate as string);
      if (endDate) filters.date.$lte = new Date(endDate as string);
    }
    
    // Category filter
    if (category) {
      filters.category = category;
    }
    
    // Status filter
    if (status) {
      filters.status = status;
    }
    
    // Allow access to everyone without authentication
    console.log('Public access to reports');
    // If userId is provided, filter by that user, otherwise show all expenses
    if (userId) {
      filters.user = new Types.ObjectId(userId as string);
      console.log('Filtering by user ID from query:', userId);
    }
    
    console.log('Final filters being applied:', JSON.stringify(filters, null, 2));
    
    // Get expenses matching filters
    const expenses = await Expense.find(filters as Record<string, unknown>)
      .populate<{ user: { name: string; email: string } }>('user', 'name email')
      .sort({ date: -1 })
      .lean() as unknown as IExpenseWithUser[];
      
    console.log(`Found ${expenses.length} expenses matching the filters`);
    
    // Calculate summary
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Group by category
    const byCategory = expenses.reduce<Record<string, number>>((acc, exp) => {
      const category = exp.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + exp.amount;
      return acc;
    }, {});
    
    // Group by status
    const byStatus = expenses.reduce<Record<string, number>>((acc, exp) => {
      const status = exp.status || 'pending';
      acc[status] = (acc[status] || 0) + exp.amount;
      return acc;
    }, {});
    
    // Monthly breakdown
    const monthlyBreakdown = expenses.reduce<Record<string, number>>((acc, exp) => {
      if (exp.date) {
        const monthYear = exp.date.toISOString().slice(0, 7); // YYYY-MM format
        acc[monthYear] = (acc[monthYear] || 0) + exp.amount;
      }
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: {
        totalExpenses: expenses.length,
        totalAmount,
        byCategory,
        byStatus,
        monthlyBreakdown,
        expenses
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Export expenses to CSV
 */
export const exportExpensesToCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, category, status, userId } = req.query;
    
    const filters: any = {};
    
    // Apply the same filters as generateExpenseReport
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate as string);
      if (endDate) filters.date.$lte = new Date(endDate as string);
    }
    
    if (category) filters.category = category;
    if (status) filters.status = status;
    // If userId is provided, filter by that user, otherwise show all expenses
    if (userId) {
      filters.user = new Types.ObjectId(userId as string);
    }
    
    const expenses = await Expense.find(filters as Record<string, unknown>)
      .populate<{ name: string; email: string }>('user', 'name email')
      .sort({ date: -1 }) as unknown as IExpenseWithUser[];
    
    // Convert to CSV
    const headers = [
      'Date',
      'Description',
      'Amount',
      'Category',
      'Status',
      'User',
      'Notes'
    ];
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const exp of expenses) {
      const row = [
        `"${exp.date.toISOString().split('T')[0]}"`,
        `"${exp.description}"`,
        exp.amount,
        `"${exp.category}"`,
        `"${exp.status}"`,
        `"${exp.user?.name || 'N/A'}"`,
        `"${exp.notes || ''}"`
      ];
      csvRows.push(row.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses_export.csv');
    
    res.status(200).send(csvContent);
    
  } catch (error) {
    next(error);
  }
};
