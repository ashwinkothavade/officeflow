import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  TextField, 
  Checkbox,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Send as SendIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  expiryDate?: string;
  vendorEmail: string;
  vendorName: string;
}

const InventoryOrder: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        // Mock data for now
        const mockData: InventoryItem[] = [
          {
            id: '1',
            name: 'Printer Paper',
            category: 'Office Supplies',
            quantity: 2,
            minQuantity: 5,
            expiryDate: '2023-12-31',
            vendorEmail: 'supplies@example.com',
            vendorName: 'Office Supplies Co.'
          },
          {
            id: '2',
            name: 'Coffee',
            category: 'Pantry',
            quantity: 1,
            minQuantity: 3,
            expiryDate: '2023-10-15',
            vendorEmail: 'beverages@example.com',
            vendorName: 'Beverage Distributors'
          }
        ];
        
        setInventory(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setError('Failed to load inventory. Please try again later.');
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const generateEmailContent = async () => {
    if (selectedItems.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        throw new Error('Please set your Gemini API key in the chat settings first.');
      }
      
      const selectedItemsData = inventory.filter(item => selectedItems.includes(item.id));
      
      const prompt = `Write a professional business email to order the following office supplies. 
Include a subject line and a well-formatted email body with the items and their quantities:

${selectedItemsData.map(item => 
        `- ${item.name} (${item.quantity} units, minimum quantity: ${item.minQuantity})`
      ).join('\n')}

Vendor: ${selectedItemsData[0]?.vendorName || 'our supplier'}

Please format the response with "Subject:" on the first line and the email body following it.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate email content');
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract subject and body from the response
      const subjectMatch = text.match(/Subject: (.+)/i);
      const subject = subjectMatch ? subjectMatch[1] : 'Order Request';
      const body = text.replace(/^Subject: .+\n\n?/i, '');
      
      setEmailSubject(subject);
      setEmailBody(body);
    } catch (error) {
      console.error('Error generating email:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) return;
    
    setIsSending(true);
    try {
      // TODO: Implement actual email sending
      console.log('Sending email:', { subject: emailSubject, body: emailBody });
      alert('Order request sent successfully!');
      setSelectedItems([]);
      setEmailSubject('');
      setEmailBody('');
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send order request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Inventory Reorder
        </Typography>
      </Box>

      {error && (
        <Box mb={3}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Low Stock Items</Typography>
        {inventory.length === 0 ? (
          <Typography>No low stock items found.</Typography>
        ) : (
          <Box>
            {inventory.map((item) => (
              <Box key={item.id} display="flex" alignItems="center" mb={1}>
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleItemSelect(item.id)}
                  color="primary"
                />
                <Box flexGrow={1}>
                  <Typography>{item.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Current: {item.quantity} | Minimum: {item.minQuantity}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box mb={2}>
          <TextField
            label="Subject"
            fullWidth
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Email Body"
            fullWidth
            multiline
            rows={6}
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            margin="normal"
          />
        </Box>
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={generateEmailContent}
            disabled={selectedItems.length === 0 || isGenerating}
            startIcon={isGenerating ? <CircularProgress size={20} /> : null}
          >
            {isGenerating ? 'Generating...' : 'Generate Email'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendEmail}
            disabled={!emailSubject || !emailBody || isSending}
            startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          >
            {isSending ? 'Sending...' : 'Send Order'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InventoryOrder;
