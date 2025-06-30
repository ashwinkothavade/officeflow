import axios from 'axios';

export interface BillData {
  _id?: string;
  amount: number;
  category: string;
  date: string;
  vendor: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
  receipt?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
  user?: string;
}

export const processBill = async (file: File): Promise<BillData> => {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error('Please set your Gemini API key in the chat settings first.');
  }

  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  // Extract the base64 data part
  const base64Image = base64Data.split(',')[1];
  const mimeType = file.type;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Extract the following information from this bill/receipt in JSON format with the following structure:
                {
                  "amount": number, // Total amount
                  "category": string, // Expense category (must be one of:'travel', 'food', 'accommodation', 'supplies', 'office-supplies', 'equipment', 'other')
                  "date": string, // Date in YYYY-MM-DD format
                  "vendor": string, // Name of the vendor/merchant
                  "description": string, // Brief description
                  "items": [
                    {
                      "name": string, // Item name
                      "quantity": number, // Optional quantity
                      "price": number // Item price
                    }
                  ]
                }
                
                Only return the JSON object, no other text.`
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract the JSON response
    let responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Debug: Log the raw response
    console.log('Raw Gemini response:', responseText);
    
    // Clean up the response to extract just the JSON
    responseText = responseText
      .replace(/^\s*```(?:json\n)?/m, '') // Remove opening ```json or ```
      .replace(/```\s*$/m, '')           // Remove closing ```
      .trim();
    
    // Debug: Log the cleaned response
    console.log('Cleaned response:', responseText);
    
    // Parse the JSON
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      throw new Error('Failed to parse the bill data. Please try again.');
    }
    
    // Debug: Log the parsed data
    console.log('Parsed data:', parsedData);
    
    // Define valid categories from the backend enum
    const validCategories = [
      'travel',
      'food',
      'accommodation',
      'supplies',
      'office-supplies',
      'equipment',
      'other'
    ] as const;
    
    type Category = typeof validCategories[number];
    
    // Normalize the category
    if (parsedData.category) {
      const categoryStr = String(parsedData.category).toLowerCase().trim();
      
      // Map common variations to valid categories
      const categoryMap: Record<string, Category> = {
        // Food related
        'food': 'food',
        'beverage': 'food',
        'restaurant': 'food',
        'cafe': 'food',
        'lunch': 'food',
        'dinner': 'food',
        'breakfast': 'food',
        'meal': 'food',
        'groceries': 'food',
        'food & beverage': 'food',
        'food and beverage': 'food',
        
        // Travel related
        'travel': 'travel',
        'transport': 'travel',
        'flight': 'travel',
        'taxi': 'travel',
        'uber': 'travel',
        'lyft': 'travel',
        'train': 'travel',
        'bus': 'travel',
        'fuel': 'travel',
        'parking': 'travel',
        
        // Accommodation
        'accommodation': 'accommodation',
        'hotel': 'accommodation',
        'lodging': 'accommodation',
        'airbnb': 'accommodation',
        'hostel': 'accommodation',
        
        // Supplies
        'supplies': 'supplies',
        'stationery': 'supplies',
        'consumables': 'supplies',
        
        // Office Supplies
        'office': 'office-supplies',
        'office supplies': 'office-supplies',
        'office-supplies': 'office-supplies',
        'stationary': 'office-supplies',
        'printer': 'office-supplies',
        'ink': 'office-supplies',
        'paper': 'office-supplies',
        
        // Equipment
        'equipment': 'equipment',
        'computer': 'equipment',
        'laptop': 'equipment',
        'phone': 'equipment',
        'device': 'equipment',
        'hardware': 'equipment',
        
        // Default
        'other': 'other',
        'misc': 'other',
        'miscellaneous': 'other'
      };
      
      // Direct match first
      if (categoryMap[categoryStr]) {
        parsedData.category = categoryMap[categoryStr];
      } else {
        // Try partial match
        const matchedEntry = Object.entries(categoryMap).find(([key]) => 
          categoryStr.includes(key) || key.includes(categoryStr)
        );
        
        // Use the mapped category or default to 'other' if not found
        parsedData.category = matchedEntry ? categoryMap[matchedEntry[0]] : 'other';
      }
    } else {
      parsedData.category = 'other';
    }
    
    // Ensure amount is a number
    if (parsedData.amount) {
      if (typeof parsedData.amount === 'string') {
        parsedData.amount = parseFloat(parsedData.amount.replace(/[^0-9.-]+/g, ''));
      }
      parsedData.amount = Number(parsedData.amount);
    } else {
      // Calculate amount from items if not provided
      if (Array.isArray(parsedData.items)) {
        parsedData.amount = parsedData.items.reduce((sum: number, item: any) => {
          const price = Number(item.price) || 0;
          const quantity = Number(item.quantity) || 1;
          return sum + (price * quantity);
        }, 0);
      } else {
        parsedData.amount = 0;
      }
    }
    
    return parsedData as BillData;
  } catch (error) {
    console.error('Error processing bill:', error);
    throw new Error('Failed to process the bill. Please try again.');
  }
};

export const uploadBill = async (file: File): Promise<BillData> => {
  // First process the bill to extract data
  const billData = await processBill(file);
  
  // Then save to your backend
  const API_URL = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api`;
  
  // Prepare the request body according to your backend's expected format
  const requestBody = {
    amount: billData.amount,
    category: billData.category,
    date: billData.date,
    vendor: billData.vendor || 'Unknown',
    description: billData.description || 'Bill upload',
    receipt: await fileToBase64(file),
    // Include items if available
    ...(billData.items && { items: billData.items })
  };

  const response = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(requestBody)
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error('Error saving bill:', responseData);
    throw new Error(responseData.message || 'Failed to save bill');
  }

  return responseData;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
