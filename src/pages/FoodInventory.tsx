import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalDining as FoodIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { 
  getFoodItems, 
  createFoodItem, 
  updateFoodItem, 
  deleteFoodItem, 
  getFoodItemStats,
  FoodItem as FoodItemType
} from '../services/foodInventoryService';

const FoodInventory: React.FC = () => {
  const [foodItems, setFoodItems] = useState<FoodItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const { getToken } = useAuth();
  
  // New food item form state
  const [newFoodItem, setNewFoodItem] = useState<Omit<FoodItemType, '_id' | 'user' | 'isExpired' | 'daysUntilExpiry' | 'createdAt' | 'updatedAt'>>({ 
    name: '',
    description: '',
    quantity: 1,
    unit: 'pcs',
    category: 'Other',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    minQuantity: 1,
    supplier: '',
    location: ''
  });

  // Load food items from API
  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        setLoading(true);
        const items = await getFoodItems();
        setFoodItems(items);
        setError(null);
      } catch (error) {
        console.error('Error loading food items:', error);
        setError('Failed to load food inventory');
        showSnackbar('Failed to load food items. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, []);

  // Get status based on expiry date
  const getFoodStatus = (expiryDate: string): 'fresh' | 'expiring_soon' | 'expired' => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring_soon';
    return 'fresh';
  };

  // Get status for an item
  const getItemStatus = (item: FoodItemType): 'fresh' | 'expiring_soon' | 'expired' => {
    if (item.isExpired) return 'expired';
    if (item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3) return 'expiring_soon';
    return 'fresh';
  };

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle add new food item
  const handleAddFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newFoodItem.name || !newFoodItem.expiryDate) {
        setError('Please fill in all required fields');
        return;
      }
      
      setLoading(true);
      const addedItem = await createFoodItem(newFoodItem);
      
      if (addedItem) {
        setFoodItems([...foodItems, addedItem]);
        setShowAddForm(false);
        setNewFoodItem({
          name: '',
          description: '',
          quantity: 1,
          unit: 'pcs',
          category: 'Other',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          minQuantity: 1,
          supplier: '',
          location: ''
        });
        showSnackbar('Food item added successfully', 'success');
      } else {
        throw new Error('Failed to add item');
      }
    } catch (error) {
      console.error('Error adding food item:', error);
      showSnackbar('Failed to add food item. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete food item
  const handleDeleteFoodItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        setLoading(true);
        const success = await deleteFoodItem(id);
        if (success) {
          setFoodItems(foodItems.filter(item => item._id !== id));
          showSnackbar('Food item deleted successfully', 'success');
        } else {
          throw new Error('Failed to delete item');
        }
      } catch (error) {
        console.error('Error deleting food item:', error);
        showSnackbar('Failed to delete food item. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Refresh food items
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const items = await getFoodItems();
      setFoodItems(items);
      setError(null);
      showSnackbar('Food inventory refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing food items:', error);
      showSnackbar('Failed to refresh food items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update food item
  const handleUpdateFoodItem = async (id: string, updatedItem: FoodItemType) => {
    try {
      setLoading(true);
      const updatedItemResponse = await updateFoodItem(id, updatedItem);
      if (updatedItemResponse) {
        setFoodItems(foodItems.map(item => item._id === id ? updatedItemResponse : item));
        showSnackbar('Food item updated successfully', 'success');
      } else {
        throw new Error('Failed to update item');
      }
    } catch (error) {
      console.error('Error updating food item:', error);
      showSnackbar('Failed to update food item. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'error';
      case 'expiring_soon':
        return 'warning';
      default:
        return 'success';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    if (status === 'expired' || status === 'expiring_soon') {
      return <WarningIcon fontSize="small" />;
    }
    return undefined; // Return undefined instead of null for Chip icon prop
  };
  
  // Get category options - must match the server's FoodItem model enum
  const categoryOptions = [
    'Dairy',
    'Meat',
    'Vegetables',
    'Fruits',
    'Beverages',
    'Snacks',
    'Grains',
    'Condiments',
    'Bakery',
    'Frozen',
    'Canned Goods',
    'Deli',
    'Seafood',
    'Desserts',
    'Other'
  ];
  
  // Get unit options
  const unitOptions = [
    'g', 'kg', 'ml', 'l', 'pcs', 'boxes', 'bottles', 'packets', 'cans', 'jars'
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <FoodIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Food Inventory
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Food Item'}
        </Button>
      </Box>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {error && (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {showAddForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Add New Food Item</Typography>
          <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}>
            <TextField
              label="Food Name"
              value={newFoodItem.name}
              onChange={(e) => setNewFoodItem({...newFoodItem, name: e.target.value})}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Description"
              value={newFoodItem.description || ''}
              onChange={(e) => setNewFoodItem({...newFoodItem, description: e.target.value})}
              fullWidth
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              label="Category"
              select
              value={newFoodItem.category}
              onChange={(e) => setNewFoodItem({...newFoodItem, category: e.target.value})}
              fullWidth
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </TextField>
            <TextField
              label="Unit"
              select
              value={newFoodItem.unit}
              onChange={(e) => setNewFoodItem({...newFoodItem, unit: e.target.value})}
              fullWidth
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </TextField>
            <TextField
              label="Quantity"
              type="number"
              value={newFoodItem.quantity}
              onChange={(e) => setNewFoodItem({...newFoodItem, quantity: Number(e.target.value)})}
              fullWidth
              required
              margin="normal"
              InputProps={{ inputProps: { min: 0, step: 'any' } }}
            />
            <TextField
              label="Minimum Quantity"
              type="number"
              value={newFoodItem.minQuantity}
              onChange={(e) => setNewFoodItem({...newFoodItem, minQuantity: Number(e.target.value)})}
              fullWidth
              required
              margin="normal"
              InputProps={{ inputProps: { min: 0, step: 'any' } }}
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={newFoodItem.expiryDate}
              onChange={(e) => setNewFoodItem({...newFoodItem, expiryDate: e.target.value})}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Supplier"
              value={newFoodItem.supplier || ''}
              onChange={(e) => setNewFoodItem({...newFoodItem, supplier: e.target.value})}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Location"
              value={newFoodItem.location || ''}
              onChange={(e) => setNewFoodItem({...newFoodItem, location: e.target.value})}
              fullWidth
              margin="normal"
            />
            <Box gridColumn={{ xs: '1 / -1', md: '1 / -1' }} display="flex" justifyContent="flex-end" gap={2}>
              <Button 
                variant="outlined" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleAddFoodItem}
                disabled={
                  !newFoodItem.name || 
                  !newFoodItem.expiryDate ||
                  isNaN(newFoodItem.quantity) || 
                  isNaN(newFoodItem.minQuantity)
                }
              >
                Add Item
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3, overflowX: 'auto' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {foodItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {loading ? 'Loading...' : 'No food items found. Add your first item!'}
                  </TableCell>
                </TableRow>
              ) : (
                foodItems.map((item) => {
                  const status = getItemStatus(item);
                  return (
                    <TableRow 
                      key={item._id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        bgcolor: status === 'expired' ? 'rgba(255, 0, 0, 0.05)' : 
                                  status === 'expiring_soon' ? 'rgba(255, 152, 0, 0.05)' : 'inherit'
                      }}
                      hover
                    >
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        {item.quantity} {item.unit} 
                        {item.quantity <= item.minQuantity && (
                          <Chip 
                            label="Low" 
                            size="small" 
                            color="warning" 
                            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }} 
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(item.expiryDate).toLocaleDateString()}
                        {item.daysUntilExpiry !== undefined && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {item.daysUntilExpiry >= 0 
                              ? `${item.daysUntilExpiry} days left` 
                              : `${Math.abs(item.daysUntilExpiry)} days ago`}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={status.replace('_', ' ')}
                          color={getStatusColor(status)}
                          icon={getStatusIcon(status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.supplier || '-'}</TableCell>
                      <TableCell>{item.location || '-'}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteFoodItem(item._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default FoodInventory;
