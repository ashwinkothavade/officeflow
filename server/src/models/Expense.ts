import mongoose, { Document, Schema, Types } from 'mongoose';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface IExpense {
  user: Types.ObjectId;
  description: string;
  amount: number;
  category: string;
  date: Date;
  receipt?: string;
  status: ExpenseStatus;
  notes?: string;
  paymentMethod?: string;
  vendor?: string;
  location?: string;
  isBillable?: boolean;
  project?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExpenseDocument extends IExpense, Document {}

const expenseSchema = new Schema<IExpenseDocument, mongoose.Model<IExpenseDocument>>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { 
      type: String, 
      required: true,
      enum: ['travel', 'food', 'accommodation', 'supplies', 'office-supplies', 'equipment', 'other']
    },
    date: { type: Date, required: true },
    receipt: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const Expense = mongoose.model<IExpenseDocument>('Expense', expenseSchema);

export default Expense;
