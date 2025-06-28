import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Types
export interface InventoryItem {
  _id: string;
  name: string;
  description?: string;
  category: 'food' | 'beverage' | 'supplies' | 'other';
  quantity: number;
  unit: string;
  pricePerUnit: number;
  expiryDate?: string;
  minStockLevel: number;
  supplier?: string;
  lastRestocked: string;
  location?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  expiringSoon: number;
  byCategory: Array<{
    _id: string;
    count: number;
    totalValue: number;
  }>;
}

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// API functions
export const inventoryApi = {
  // Get all inventory items
  getInventory: async (params?: {
    category?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
  }) => {
    const response = await axios.get<ApiResponse<InventoryItem[]>>(`${API_URL}/inventory`, { params });
    return response.data.data;
  },

  // Get inventory summary
  getSummary: async () => {
    const response = await axios.get<ApiResponse<InventorySummary>>(`${API_URL}/inventory/summary`);
    return response.data.data;
  },

  // Get expiring soon items
  getExpiringSoon: async (days = 30) => {
    const response = await axios.get<ApiResponse<InventoryItem[]>>(`${API_URL}/inventory/expiring-soon`, {
      params: { days },
    });
    return response.data.data;
  },

  // Get single item
  getItem: async (id: string) => {
    const response = await axios.get<ApiResponse<InventoryItem>>(`${API_URL}/inventory/${id}`);
    return response.data.data;
  },

  // Create new item
  createItem: async (item: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt' | 'lastRestocked'>) => {
    try {
      const response = await axios.post<ApiResponse<InventoryItem>>(`${API_URL}/inventory`, item);
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to create item: Invalid response from server');
    } catch (error: any) {
      console.error('Error creating item:', error);
      throw new Error(error.response?.data?.error || 'Failed to create item');
    }
  },

  // Update item
  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const response = await axios.put<ApiResponse<InventoryItem>>(`${API_URL}/inventory/${id}`, updates);
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to update item: Invalid response from server');
    } catch (error: any) {
      console.error('Error updating item:', error);
      throw new Error(error.response?.data?.error || 'Failed to update item');
    }
  },

  // Delete item
  deleteItem: async (id: string) => {
    const response = await axios.delete<ApiResponse<{ success: boolean }>>(`${API_URL}/inventory/${id}`);
    return response.data.success;
  },
};

export default inventoryApi;
