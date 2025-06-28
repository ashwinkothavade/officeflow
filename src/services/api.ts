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

const API_URL = 'http://localhost:5000/api';

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
      return handleResponse(response);
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
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Delete an expense
  deleteExpense: async (id: string): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete(`/expenses/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
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
