import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Expense from '../models/Expense';

// Extend the Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      _id: Types.ObjectId;
      role?: string;
    };
  }
}

// Define a type for our request with custom properties
export type ExpenseRequest = Request & {
  params: {
    id?: string;
    [key: string]: string | undefined;
  };
  body: {
    description?: string;
    amount?: number;
    category?: string;
    date?: Date | string;
    notes?: string;
    receipt?: string;
    status?: 'pending' | 'approved' | 'rejected';
    userId?: string;
  };
};

interface ExpenseSummary {
  totalAmount: number;
  totalExpenses: number;
  byCategory: Array<{ category: string; amount: number; count: number }>;
  byStatus: Array<{ status: string; amount: number; count: number }>;
  monthlyTrend: Array<{ month: string; amount: number; count: number }>;
}

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Public
export const createExpense = async (req: ExpenseRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Request body:', req.body);
    
    const { description, amount, category, date, notes, receipt, status } = req.body;
    
    console.log('Parsed fields:', { description, amount, category, date, notes, receipt, status });
    
    // Create a default user ID if not provided
    const defaultUserId = new Types.ObjectId();
    
    const expenseData = {
      description,
      amount: Number(amount), // Ensure amount is a number
      category,
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      receipt: receipt || '',
      status: status || 'pending',
      user: req.body.userId ? new Types.ObjectId(req.body.userId) : defaultUserId,
    };
    
    console.log('Expense data to save:', expenseData);
    
    const expense = new Expense(expenseData);
    
    console.log('Expense document created, attempting to save...');
    
    const createdExpense = await expense.save();
    
    console.log('Expense saved successfully:', createdExpense);
    
    res.status(201).json({
      success: true,
      data: createdExpense
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      console.error('Validation errors:', messages);
      
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
      return;
    }
    
    console.error('Unexpected error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create expense',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
export const getExpenses = async (req: ExpenseRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, category, startDate, endDate, date } = req.query as {
      status?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
      date?: string;
    };
    
    // Initialize query object
    const query: any = {};
    
    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    
    // Handle date filtering
    if (date) {
      // If a specific date is provided, find expenses for that exact date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      // Handle date range filtering
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }
    next(error);
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Public
export const getExpense = async (req: ExpenseRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    res.json(expense);
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Public
export const updateExpense = async (req: ExpenseRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { description, amount, category, date, notes, receipt, status } = req.body;
    
    const updateData: any = {};
    
    // Only update fields that are provided in the request
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = amount;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = new Date(date);
    if (notes !== undefined) updateData.notes = notes;
    if (receipt !== undefined) updateData.receipt = receipt;
    if (status !== undefined) updateData.status = status;

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
      return;
    }

    res.json({
      success: true,
      data: updatedExpense
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid expense ID'
      });
      return;
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: messages
      });
      return;
    }
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Public
export const deleteExpense = async (req: ExpenseRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid expense ID'
      });
      return;
    }
    next(error);
  }
};

// @desc    Update expense status
// @route   PATCH /api/expenses/:id/status
// @access  Public
export const updateExpenseStatus = async (req: ExpenseRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    
    // Define valid status values
    type Status = 'pending' | 'approved' | 'rejected';
    const validStatuses: Status[] = ['pending', 'approved', 'rejected'];
    
    // Check if status is provided and valid
    if (!status || !validStatuses.includes(status as Status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    // Set the status (we've already validated it's a valid status)
    expense.status = status as Status;
    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }
    next(error);
  }
};

// @desc    Get expense summary for dashboard
// @route   GET /api/expenses/summary
// @access  Public
export const getExpenseSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Base query - include all expenses
    const match: any = {};

    // Get current date range (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    match.date = { $gte: twelveMonthsAgo };

    // Execute all aggregations in parallel
    const [
      totalStats,
      categoryStats,
      statusStats,
      monthlyStats
    ] = await Promise.all([
      // Total amount and count
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalExpenses: { $sum: 1 }
          }
        }
      ]),
      
      // By category
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { amount: -1 } }
      ]),
      
      // By status
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Monthly trend
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            month: {
              $dateToString: {
                format: '%Y-%m',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: 1
                  }
                }
              }
            },
            amount: 1,
            count: 1
          }
        }
      ])
    ]);

    // Format the response
    const summary: ExpenseSummary = {
      totalAmount: totalStats[0]?.totalAmount || 0,
      totalExpenses: totalStats[0]?.totalExpenses || 0,
      byCategory: categoryStats.map(stat => ({
        category: stat._id,
        amount: stat.amount,
        count: stat.count
      })),
      byStatus: statusStats.map(stat => ({
        status: stat._id,
        amount: stat.amount,
        count: stat.count
      })),
      monthlyTrend: monthlyStats.map(stat => ({
        month: stat.month,
        amount: stat.amount,
        count: stat.count
      }))
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};
