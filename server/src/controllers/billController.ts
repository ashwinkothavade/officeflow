import { Request, Response, NextFunction, RequestHandler } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import Expense from '../models/Expense';
import { AuthenticatedRequest } from '../types/express';
import upload from '../utils/fileUpload';
import ocrService from '../services/ocrService';
import { validationResult } from 'express-validator';

// Extend the Express Request type to include the file property
export interface RequestWithFile extends Request {
  file?: Express.Multer.File;
  user?: any; // We'll type this properly in the actual implementation
}

// Single file upload middleware
export const uploadBill: RequestHandler = (req: RequestWithFile, res: Response, next: NextFunction) => {
  upload.single('receipt')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'Error uploading file' 
      });
    }
    next();
  });
};

// Process uploaded bill and create expense
export const processBill: RequestHandler = async (req: RequestWithFile, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Extract text from the uploaded file
    const filePath = path.join(process.cwd(), req.file.path);
    const extractedText = await ocrService.extractText(filePath);
    
    // Parse the extracted text to get expense details
    const expenseData = ocrService.parseExpenseFromText(extractedText);

    // Create new expense
    const expense = new Expense({
      user: authReq.user._id,
      description: expenseData.description,
      amount: expenseData.amount,
      category: expenseData.category,
      date: expenseData.date,
      receipt: req.file.filename,
      status: 'pending',
    });

    await expense.save();

    // Clean up the uploaded file after processing
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting uploaded file:', error);
    }

    res.status(201).json({
      success: true,
      data: {
        ...expense.toObject(),
        receiptUrl: `/api/bills/${expense.receipt}`,
        extractedText,
      },
    });
  } catch (error) {
    console.error('Error processing bill:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing bill',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get bill receipt
export const getBillReceipt: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', 'receipts', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ 
        success: false, 
        message: 'Receipt not found' 
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error getting receipt:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving receipt' 
    });
  }
};

// Get all bills for the authenticated user
export const getUserBills: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const expenses = await Expense.find({ user: authReq.user._id })
      .sort({ date: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses.map(expense => ({
        ...expense.toObject(),
        receiptUrl: expense.receipt ? `/api/bills/${expense.receipt}` : null,
      })),
    });
  } catch (error) {
    console.error('Error getting user bills:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving bills' 
    });
  }
};
