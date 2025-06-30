import axios from 'axios';

// Define response types
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface FoodItemsResponse {
  items: FoodItem[];
}

interface FoodItemResponse {
  foodItem: FoodItem;
}

interface FoodItemStatsResponse {
  stats: FoodItemStats[];
  summary: {
    totalItems: number;
    expiredItems: number;
    expiringSoon: number;
    lowStock: number;
  };
}

const API_URL = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api`;

// Response interfaces
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface FoodItemsResponse {
  items: FoodItem[];
}

interface FoodItemResponse {
  foodItem: FoodItem;
}

interface FoodItemStatsResponse {
  stats: FoodItemStats[];
  summary: {
    totalItems: number;
    expiredItems: number;
    expiringSoon: number;
    lowStock: number;
  };
}

export interface FoodItem {
  _id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: string;
  minQuantity: number;
  supplier?: string;
  location?: string;
  user: string;
  isExpired: boolean;
  daysUntilExpiry: number;
  createdAt: string;
  updatedAt: string;
}

export interface FoodItemStats {
  _id: string;
  totalItems: number;
  totalQuantity: number;
  expiredItems: number;
  expiringSoon: number;
  lowStock: number;
}

// Get all food items
export const getFoodItems = async (category?: string, expiringSoon?: boolean): Promise<FoodItem[]> => {
  try {
    const response = await axios.get<{ items: FoodItem[] }>(`${API_URL}/food-items`, {
      params: { category, expiringSoon },
    });
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching food items:', error);
    return [];
  }
};

// Create a new food item
export const createFoodItem = async (foodItemData: Partial<FoodItem>): Promise<FoodItem | null> => {
  try {
    const response = await axios.post<{ foodItem: FoodItem }>(
      `${API_URL}/food-items`,
      foodItemData,
    );
    return response.data.foodItem || null;
  } catch (error) {
    console.error('Error creating food item:', error);
    return null;
  }
};

// Update a food item
export const updateFoodItem = async (
  id: string,
  foodItemData: Partial<FoodItem>
): Promise<FoodItem | null> => {
  try {
    const response = await axios.patch<{ foodItem: FoodItem }>(
      `${API_URL}/food-items/${id}`,
      foodItemData
    );
    return response.data.foodItem || null;
  } catch (error) {
    console.error('Error updating food item:', error);
    return null;
  }
};

// Delete a food item
export const deleteFoodItem = async (id: string): Promise<boolean> => {
  try {
    await axios.delete(`${API_URL}/food-items/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting food item:', error);
    return false;
  }
};

// Get food item statistics
export const getFoodItemStats = async () => {
  try {
    const response = await axios.get<ApiResponse<FoodItemStatsResponse>>(`${API_URL}/food-items/stats`);
    return response.data.data || {
      stats: [],
      summary: {
        totalItems: 0,
        expiredItems: 0,
        expiringSoon: 0,
        lowStock: 0
      }
    };
  } catch (error) {
    console.error('Error fetching food stats:', error);
    return {
      stats: [],
      summary: {
        totalItems: 0,
        expiredItems: 0,
        expiringSoon: 0,
        lowStock: 0
      }
    };
  }
};
