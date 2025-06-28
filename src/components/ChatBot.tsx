import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  TextField, 
  Paper, 
  Typography, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../contexts/ChatContext';
import { expenseApi } from '../services/api';
import inventoryApi from '../services/inventoryApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  apiKey: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ apiKey }) => {
  const { isChatOpen, toggleChat } = useChat();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Welcome to OfficeFlow Assistant! I can help you with:

🔹 Expense Tracking
- Show my recent expenses
- How much did I spend on [category] this month?
- What's my total spending for [time period]?

🔹 Inventory Management
- What items are low in stock?
- Show me all items in [location]
- Do we need to restock [item]?

🔹 General Office Management
- What tasks are pending?
- Show me upcoming deadlines
- Who is responsible for [task]?

I can analyze your data and provide insights. Just ask me anything about your office operations!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch expenses and inventory data
        const [expensesResponse, inventoryResponse] = await Promise.all([
          expenseApi.getExpenses(),
          inventoryApi.getInventory()
        ]);
        
        // Extract data from API responses
        // The inventoryApi.getInventory() returns the data directly, not in a .data property
        const expensesData = Array.isArray(expensesResponse) ? expensesResponse : [];
        const inventoryData = Array.isArray(inventoryResponse) ? inventoryResponse : [];
        
        setExpenses(expensesData);
        setInventory(inventoryData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Add error message to chat
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error while loading your data. Please try again later.',
          timestamp: new Date()
        }]);
      } finally {
        setLoading(false);
      }
    };

    if (isChatOpen && apiKey) {
      fetchData();
    }
  }, [isChatOpen, apiKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the message text from the input field
    const messageText = input.trim();
    if (!messageText) return;
    
    console.log('Sending message:', messageText); // Debug log
    
    // Create a proper message object
    const userMessage: Message = {
      role: 'user',
      content: messageText,  // Ensure we're using the string value
      timestamp: new Date()
    };
    
    // Update the UI immediately with the user's message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context data for the AI
      const contextData = {
        expenses: expenses.slice(0, 5).map(expense => ({
          description: expense.description || 'No description',
          amount: expense.amount || 0,
          category: expense.category || 'Uncategorized',
          date: expense.date || new Date().toISOString(),
          status: expense.status || 'Pending'
        })),
        inventory: inventory.slice(0, 5).map(item => ({
          name: item.name || 'Unnamed Item',
          category: item.category || 'Uncategorized',
          quantity: item.quantity || 0,
          unit: item.unit || 'pcs',
          location: item.location || 'Unspecified Location'
        }))
      };
      
      console.log('Context data prepared:', contextData); // Debug log

      // Prepare a structured prompt with clear instructions
      const systemPrompt = `You are an advanced AI assistant for an office management system called OfficeFlow.

RESPONSE FORMAT RULES:
- ALWAYS respond in markdown format
- Use bullet points for lists
- Never use bold (**)
- Use tables for comparing multiple items
- Include relevant emojis for better readability
- If calculating totals, show the calculation
- If data is limited, state it explicitly

DATA ANALYSIS CAPABILITIES:
- Expense analysis and categorization
- Inventory level monitoring
- Trend identification
- Data summarization
- Comparative analysis

CURRENT DATA CONTEXT:
- Expenses: ${contextData.expenses.length} recent records
- Inventory: ${contextData.inventory.length} items

Follow these guidelines when responding:
1. For financial questions: Include amounts, dates, and categories
2. For inventory questions: Include quantities, locations, and stock status
3. For analysis: Provide insights and highlight key points
4. For requests with multiple parts: Address each part separately with headings`;

      // Format the data for better context
      const formatExpenses = (expenses: any[]) => {
        return expenses.map(exp => ({
          'Date': new Date(exp.date).toLocaleDateString(),
          'Description': exp.description,
          'Amount': `$${exp.amount.toFixed(2)}`,
          'Category': exp.category,
          'Status': exp.status
        }));
      };

      const formatInventory = (items: any[]) => {
        return items.map(item => ({
          'Item': item.name,
          'Category': item.category,
          'Quantity': item.quantity,
          'Unit': item.unit,
          'Location': item.location,
          'Status': item.quantity < 5 ? '⚠️ Low Stock' : 'In Stock'
        }));
      };

      // Format the user's message text directly
      const userQuestion = typeof userMessage.content === 'string' ? 
        userMessage.content : 
        JSON.stringify(userMessage.content);
      
      const prompt = `SYSTEM: ${systemPrompt}

CURRENT DATE: ${new Date().toLocaleDateString()}

EXPENSE DATA (last 5):
${JSON.stringify(formatExpenses(contextData.expenses), null, 2)}

INVENTORY DATA (first 5):
${JSON.stringify(formatInventory(contextData.inventory), null, 2)}

USER QUESTION: "${userQuestion}"

INSTRUCTIONS:
1. Analyze the user's question and available data
2. Provide a clear, concise response
3. Use markdown formatting for better readability
4. Include specific numbers and details from the data
5. If data is missing, be clear about what's not available`;

      console.log('Sending request to Gemini API with prompt:', prompt);
      
      // Call Gemini API with the message and context
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,  // Lower temperature for more focused responses
            topK: 20,         // More focused token selection
            topP: 0.9,        // Slightly more deterministic
            maxOutputTokens: 800,  // Keep responses concise
          },
        })
      });

      console.log('API Response status:', response.status);
      const responseData = await response.json();
      console.log('API Response data:', responseData);

      if (!response.ok) {
        console.error('API Error:', responseData);
        throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(responseData)}`);
      }

      // Process the API response to ensure clean output
      let aiResponse = '';
      
      // Try different response formats from Gemini API
      if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponse = responseData.candidates[0].content.parts[0].text;
      } else if (responseData.text) {
        aiResponse = responseData.text;
      } else if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
        // Alternative path for some response formats
        aiResponse = responseData.candidates[0].content.parts[0].text;
      } else {
        console.error('Unexpected API response format:', responseData);
        throw new Error('Received an unexpected response format from the API');
      }
      
      // Clean up the response
      aiResponse = aiResponse
        .replace(/^RESPONSE[\s:]*/i, '')  // Remove leading 'RESPONSE:' if present
        .trim()
        .replace(/\n{3,}/g, '\n\n');  // Limit consecutive newlines
      
      // If the response is empty or too short, provide a fallback
      if (!aiResponse || aiResponse.trim().length < 5) {
        aiResponse = 'I couldn\'t generate a response. Could you try rephrasing your question?';
      }
      
      // Add AI response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }]);
    } catch (error: unknown) {
      console.error('Error calling Gemini API:', error);
      let errorMessage = 'An unknown error occurred';
      let statusCode: number | undefined;
      
      // Handle different types of errors
      if (typeof error === 'object' && error !== null) {
        const err = error as {
          message?: string;
          response?: {
            status?: number;
            data?: unknown;
          };
        };
        
        errorMessage = err.message || errorMessage;
        statusCode = err.response?.status;
        
        console.error('Full error details:', {
          error: err,
          response: err.response?.data,
          status: statusCode
        });
      }
      
      let userFriendlyMessage = 'Sorry, I encountered an error processing your request. ';
      
      if (statusCode === 400) {
        userFriendlyMessage += 'The request was invalid. Please check your input and try again.';
      } else if (statusCode === 401 || statusCode === 403) {
        userFriendlyMessage += 'Authentication failed. Please check your API key and try again.';
      } else if (statusCode === 429) {
        userFriendlyMessage += 'Too many requests. Please wait a moment and try again.';
      } else if (errorMessage.includes('Failed to fetch')) {
        userFriendlyMessage += 'Network error. Please check your internet connection.';
      } else {
        userFriendlyMessage += `Error: ${errorMessage}`;
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: userFriendlyMessage,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isChatOpen} onClose={toggleChat} maxWidth="sm" fullWidth>
        <DialogTitle>Loading Chat</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>Loading your data...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={isChatOpen} 
      onClose={toggleChat} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px',
          width: '100%',
          maxWidth: '500px',
          borderRadius: 2,
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'white',
        p: 2
      }}>
        <Box display="flex" alignItems="center">
          <SmartToyIcon sx={{ mr: 1 }} />
          <Typography variant="h6">OfficeFlow Assistant</Typography>
        </Box>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={toggleChat}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          <List>
            {messages.map((message, index) => (
              <ListItem 
                key={index} 
                sx={{ 
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  mb: 1
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: message.role === 'user' ? 'primary.main' : 'grey.500' }}>
                    {message.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                  </Avatar>
                </ListItemAvatar>
                <Box 
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: message.role === 'user' ? 'primary.light' : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    maxWidth: '80%',
                    ml: message.role === 'user' ? 0 : 1,
                    mr: message.role === 'user' ? 1 : 0,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'right',
                      color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      mt: 0.5
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </ListItem>
            ))}
            {isLoading && (
              <ListItem>
                <CircularProgress size={24} />
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Box>
      
        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask me about your expenses or inventory..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  '& fieldset': {
                    borderColor: 'grey.300',
                  },
                },
              }}
            />
            <IconButton 
              type="submit" 
              color="primary" 
              disabled={!input.trim() || isLoading}
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                  bgcolor: 'primary.dark',
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ChatBot;
