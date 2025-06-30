import axios from 'axios';

// Simplified interfaces
export interface Expense {
  _id: string;
  user: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status?: 'pending' | 'approved' | 'rejected';
  notes?: string;
  receipt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExpenseSummary {
  totalAmount: number;
  totalExpenses: number;
  byCategory: Array<{ category: string; amount: number; count: number }>;
  byStatus: Array<{ status: string; amount: number; count: number }>;
  monthlyTrend: Array<{ month: string; amount: number; count: number }>;
}

export interface Expense {
  _id: string;
  user: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status?: 'pending' | 'approved' | 'rejected';
  notes?: string;
  receipt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExpenseSummary {
  totalAmount: number;
  totalExpenses: number;
  byCategory: Array<{ category: string; amount: number; count: number }>;
  byStatus: Array<{ status: string; amount: number; count: number }>;
  monthlyTrend: Array<{ month: string; amount: number; count: number }>;
}

const API_URL = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api`;

// Set up axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// No authentication interceptor - open access

// Helper function to handle API responses
const handleResponse = (response: any) => {
  // Check if the response has a success flag and data property
  if (response.data && typeof response.data.success !== 'undefined' && response.data.data) {
    return response.data.data;
  }
  // Fallback to the entire response data if not in expected format
  return response.data;
};

const handleError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Response error:', error.response.data);
    console.error('Status:', error.response.status);
    console.error('Headers:', error.response.headers);
    throw new Error(error.response.data?.message || 'Something went wrong');
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Request error:', error.request);
    throw new Error('No response from server');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error:', error.message);
    throw error;
  }
};

// Expense API
export const expenseApi = {
  // Create a new expense
  createExpense: async (expenseData: Omit<Expense, '_id' | 'user' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
    try {
      const response = await api.post('/expenses', expenseData);
      const result = handleResponse(response);
      // Ensure we return the expense data in the expected format
      return {
        _id: result._id || result.expense?._id,
        description: result.description || result.expense?.description,
        amount: result.amount || result.expense?.amount,
        category: result.category || result.expense?.category,
        date: result.date || result.expense?.date,
        status: result.status || result.expense?.status || 'pending',
        user: result.user || result.expense?.user || 'public-user',
        receipt: result.receipt || result.expense?.receipt || '',
        notes: result.notes || result.expense?.notes || '',
        createdAt: result.createdAt || result.expense?.createdAt || new Date().toISOString(),
        updatedAt: result.updatedAt || result.expense?.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Get all expenses
  getExpenses: async (params: Record<string, any> = {}): Promise<Expense[]> => {
    try {
      const response = await api.get('/expenses', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Get expense summary
  getExpenseSummary: async (): Promise<ExpenseSummary> => {
    try {
      const response = await api.get('/expenses/summary');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Update an expense
  updateExpense: async (id: string, expenseData: Partial<Expense>): Promise<Expense> => {
    try {
      const response = await api.put(`/expenses/${id}`, expenseData);
      const result = handleResponse(response);
      // Ensure we return the expense data in the expected format
      return {
        _id: result._id || id,
        description: result.description || expenseData.description || '',
        amount: result.amount || expenseData.amount || 0,
        category: result.category || expenseData.category || 'other',
        date: result.date || expenseData.date || new Date().toISOString(),
        status: result.status || expenseData.status || 'pending',
        user: result.user || expenseData.user || 'public-user',
        receipt: result.receipt || expenseData.receipt || '',
        notes: result.notes || expenseData.notes || '',
        createdAt: result.createdAt || new Date().toISOString(),
        updatedAt: result.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Delete an expense
  deleteExpense: async (id: string): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete(`/expenses/${id}`);
      const result = handleResponse(response);
      // Return success if the API returns a success flag or if we get here without errors
      return { success: result.success !== false };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { success: false };
    }
  },

  // Update expense status (admin only)
  updateExpenseStatus: async (id: string, status: 'pending' | 'approved' | 'rejected'): Promise<Expense> => {
    try {
      const response = await api.patch(`/expenses/${id}/status`, { status });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

export default api;
