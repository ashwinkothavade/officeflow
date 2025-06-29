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
  const [showAddForm, setShowAddForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({ 
    name: '',
    category: '',
    quantity: 0,
    minQuantity: 1,
    expiryDate: '',
    vendorEmail: '',
    vendorName: ''
  });
  
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

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
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
    if (!recipientEmail) {
      setError('Please enter a recipient email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      // Encode the subject and body for URL
      const encodedSubject = encodeURIComponent(emailSubject);
      const encodedBody = encodeURIComponent(emailBody);
      
      // Create mailto link
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;
      
      // Open default email client
      window.location.href = mailtoLink;
      
      // Reset form after a short delay
      setTimeout(() => {
        setSelectedItems([]);
        setEmailSubject('');
        setEmailBody('');
        setRecipientEmail('');
        setIsSending(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error preparing email:', error);
      setError('Failed to prepare email. Please try again.');
      setIsSending(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || !newItem.vendorName || !newItem.vendorEmail) {
      setError('Please fill in all required fields');
      return;
    }

    const newId = (inventory.length + 1).toString();
    setInventory([...inventory, { ...newItem, id: newId }]);
    
    // Reset form
    setNewItem({ 
      name: '',
      category: '',
      quantity: 0,
      minQuantity: 1,
      expiryDate: '',
      vendorEmail: '',
      vendorName: ''
    });
    
    setShowAddForm(false);
    setError(null);
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
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Item'}
        </Button>
      </Box>

      {error && (
        <Box mb={3}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {showAddForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Add New Item</Typography>
          <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}>
            <TextField
              label="Item Name"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Category"
              value={newItem.category}
              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Current Quantity"
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
              fullWidth
              required
              InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              label="Minimum Quantity"
              type="number"
              value={newItem.minQuantity}
              onChange={(e) => setNewItem({...newItem, minQuantity: Number(e.target.value)})}
              fullWidth
              required
              InputProps={{ inputProps: { min: 1 } }}
            />
            <TextField
              label="Vendor Name"
              value={newItem.vendorName}
              onChange={(e) => setNewItem({...newItem, vendorName: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Vendor Email"
              type="email"
              value={newItem.vendorEmail}
              onChange={(e) => setNewItem({...newItem, vendorEmail: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Expiry Date (Optional)"
              type="date"
              value={newItem.expiryDate}
              onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
            <Box gridColumn={{ xs: '1 / -1', md: '1 / -1' }} display="flex" justifyContent="flex-end">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleAddItem}
                disabled={
                  !newItem.name || 
                  !newItem.category || 
                  isNaN(newItem.quantity) || 
                  isNaN(newItem.minQuantity) ||
                  !newItem.vendorName ||
                  !newItem.vendorEmail
                }
              >
                Add Item
              </Button>
            </Box>
          </Box>
        </Paper>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <TextField
              label="Recipient Email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              fullWidth
              required
              placeholder="vendor@example.com"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendEmail}
              disabled={!emailSubject || !emailBody || !recipientEmail || isSending}
              startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              fullWidth
            >
              {isSending ? 'Preparing Email...' : 'Open Email Client'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default InventoryOrder;
