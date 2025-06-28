import React, { useState, useEffect, useCallback, useMemo, ReactElement } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TableSortLabel,
  Paper, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  MenuItem, 
  InputAdornment, 
  Typography, 
  Tabs, 
  Tab, 
  Snackbar, 
  Alert, 
  AlertColor, 
  Card, 
  CardContent, 
  CircularProgress,
  SelectChangeEvent,
  Grid,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, differenceInDays, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { inventoryApi, InventoryItem as ApiInventoryItem } from '../services/inventoryApi';

// Types
type TabValue = 'all' | 'low-stock' | 'expiring-soon';
type Category = 'food' | 'beverage' | 'supplies' | 'other';
type Unit = 'pcs' | 'kg' | 'g' | 'l' | 'ml' | 'boxes' | 'packets' | 'bottles' | 'cans';

interface InventoryItem extends Omit<ApiInventoryItem, 'unit' | 'category'> {
  unit: Unit;
  category: Category;
  notes?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

type InventoryFormData = Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt' | 'lastRestocked'> & {
  _id?: string;
};

const defaultFormData: InventoryFormData = {
  name: '',
  description: '',
  category: 'supplies',
  quantity: 0,
  unit: 'pcs',
  pricePerUnit: 0,
  minStockLevel: 5,
  location: '',
  supplier: '',
  barcode: '',
  notes: ''
};

// Unit and category options with labels
const unitOptions = [
  { value: 'pcs' as const, label: 'Pieces' },
  { value: 'kg' as const, label: 'Kilograms' },
  { value: 'g' as const, label: 'Grams' },
  { value: 'l' as const, label: 'Liters' },
  { value: 'ml' as const, label: 'Milliliters' },
  { value: 'boxes' as const, label: 'Boxes' },
  { value: 'packets' as const, label: 'Packets' },
  { value: 'bottles' as const, label: 'Bottles' },
  { value: 'cans' as const, label: 'Cans' }
];

const categoryOptions = [
  { value: 'food' as const, label: 'Food' },
  { value: 'beverage' as const, label: 'Beverage' },
  { value: 'supplies' as const, label: 'Supplies' },
  { value: 'other' as const, label: 'Other' }
];

// Sample locations for the dropdown
const locations = ['Storage Room', 'Kitchen', 'Office', 'Warehouse'];

// Helper function to get label from value
const getLabelFromValue = <T extends { value: string; label: string }>(
  options: T[], 
  value: string
): string => options.find(opt => opt.value === value)?.label || value;

type Order = 'asc' | 'desc';

const Inventory: React.FC = () => {
  // State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>(defaultFormData);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof InventoryItem>('name');
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleRequestSort = (property: keyof InventoryItem) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getComparator = (order: Order, orderBy: keyof InventoryItem): (a: InventoryItem, b: InventoryItem) => number => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = <T, >(a: T, b: T, orderBy: keyof T): number => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const stableSort = <T, >(array: T[], comparator: (a: T, b: T) => number): T[] => {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  // Filtered inventory based on active tab and search term
  const filteredInventory = useMemo(() => {
    return stableSort(inventory, getComparator(order, orderBy)).filter(item => {
      // Filter by search term
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by active tab
      switch (activeTab) {
        case 'low-stock':
          return matchesSearch && item.quantity <= item.minStockLevel;
        case 'expiring-soon':
          const today = new Date();
          const twoWeeksFromNow = addDays(today, 14);
          const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
          return matchesSearch && 
                 expiryDate && 
                 isAfter(expiryDate, today) && 
                 isBefore(expiryDate, twoWeeksFromNow);
        default:
          return matchesSearch;
      }
    });
  }, [inventory, activeTab, searchTerm, order, orderBy]);

  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await inventoryApi.getInventory();
        // Convert API data to our typed format
        const typedData = data.map(item => ({
          ...item,
          unit: (item.unit as Unit) || 'pcs',
          category: (item.category as Category) || 'other',
          notes: (item as any).notes || '' 
        }));
        setInventory(typedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load inventory');
        setSnackbar({
          open: true,
          message: 'Failed to load inventory',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Show snackbar notification
  const showSnackbar = useCallback((message: string, severity: SnackbarState['severity'] = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);

  // Close snackbar
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev: SnackbarState) => ({ ...prev, open: false }));
  }, []);

  // Open dialog for adding new item
  const handleOpenAddDialog = useCallback(() => {
    setFormData(defaultFormData);
    setEditingItem(null);
    setDialogOpen(true);
  }, []);

  // Open dialog for editing item
  const handleOpenEditDialog = useCallback((item: InventoryItem) => {
    setFormData({
      ...defaultFormData,
      ...item,
      _id: item._id,
      notes: item.notes || ''
    });
    setEditingItem(item);
    setDialogOpen(true);
  }, []);

  // Close dialog and reset form
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setFormData(defaultFormData);
    setEditingItem(null);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  // Handle delete confirmation close
  const handleDeleteClose = useCallback(() => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;
    
    try {
      const result = await inventoryApi.deleteItem(itemToDelete);
      if (result !== undefined) { // Check if delete was successful
        setInventory(prev => prev.filter(item => item._id !== itemToDelete));
        showSnackbar('Item deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      showSnackbar(`Failed to delete item: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      handleDeleteClose();
    }
  }, [itemToDelete, handleDeleteClose, showSnackbar]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle form input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as { name: string; value: string };
    setFormData((prev: InventoryFormData) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle category change with proper TypeScript typing
  const handleCategoryChange = (e: SelectChangeEvent<Category>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      category: value as Category
    }));
  };

  // Handle unit change with proper TypeScript typing
  const handleUnitChange = (e: SelectChangeEvent<Unit>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      unit: value as Unit
    }));
  };

  // Handle location change
  const handleLocationChange = (e: SelectChangeEvent<string>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: value
    }));
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      expiryDate: date ? date.toISOString() : undefined
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare the data to send to the API
      const itemData = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        pricePerUnit: Number(formData.pricePerUnit) || 0,
        minStockLevel: Number(formData.minStockLevel) || 5
      };

      if (editingItem) {
        // Update existing item
        const updatedItem = await inventoryApi.updateItem(editingItem._id, itemData);
        if (updatedItem && updatedItem._id) {
          setInventory(inventory.map(item => 
            item._id === editingItem._id ? {
              ...updatedItem,
              unit: (updatedItem.unit as Unit) || 'pcs',
              category: (updatedItem.category as Category) || 'other',
              notes: (updatedItem as any).notes || ''
            } : item
          ));
          showSnackbar('Item updated successfully!', 'success');
          handleCloseDialog();
        } else {
          throw new Error('Failed to update item');
        }
      } else {
        // Create new item
        const newItem = await inventoryApi.createItem(itemData);
        if (newItem && newItem._id) {
          setInventory([{
            ...newItem,
            unit: (newItem.unit as Unit) || 'pcs',
            category: (newItem.category as Category) || 'other',
            notes: (newItem as any).notes || ''
          }, ...inventory]);
          showSnackbar('Item added successfully!', 'success');
          handleCloseDialog();
        } else {
          throw new Error('Failed to create item');
        }
      }
    } catch (err) {
      console.error('Error saving item:', err);
      showSnackbar(`Failed to save item: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  // Handle item deletion
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryApi.deleteItem(id);
        setInventory(inventory.filter(item => item._id !== id));
        showSnackbar('Item deleted successfully!', 'success');
      } catch (err) {
        console.error('Error deleting item:', err);
        showSnackbar('Failed to delete item. Please try again.', 'error');
      }
    }
  };

  // Handle dialog open/close
  const handleOpen = () => setDialogOpen(true);
  
  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setFormData(defaultFormData);
    setEditingItem(null);
  }, []);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate days until expiry
  const daysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate inventory summary
  const inventorySummary = useMemo(() => {
    const totalItems = filteredInventory.length;
    const lowStockItems = filteredInventory.filter(item => item.quantity <= item.minStockLevel).length;
    const categories = new Set(filteredInventory.map(item => item.category));
    
    return {
      totalItems,
      lowStockItems,
      categoryCount: categories.size
    };
  }, [filteredInventory]);

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Inventory
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{ minWidth: '150px' }}
        >
          Add Item
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="All Items" value="all" />
            <Tab label="Low Stock" value="low-stock" />
            <Tab label="Expiring Soon" value="expiring-soon" />
          </Tabs>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Box display="flex" gap={3} flexWrap="wrap">
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Items</Typography>
              <Typography variant="h5">{inventorySummary.totalItems}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Categories</Typography>
              <Typography variant="h5">{inventorySummary.categoryCount}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Low Stock</Typography>
              <Typography variant="h5" color="error">
                {inventorySummary.lowStockItems} {inventorySummary.lowStockItems === 1 ? 'item' : 'items'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell
                sortDirection={orderBy === 'name' ? order : false}
                onClick={() => handleRequestSort('name')}
                sx={{ cursor: 'pointer' }}
              >
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                >
                  Item Name
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={orderBy === 'category' ? order : false}
                onClick={() => handleRequestSort('category')}
                sx={{ cursor: 'pointer' }}
              >
                <TableSortLabel
                  active={orderBy === 'category'}
                  direction={orderBy === 'category' ? order : 'asc'}
                >
                  Category
                </TableSortLabel>
              </TableCell>
              <TableCell 
                align="right"
                sortDirection={orderBy === 'quantity' ? order : false}
                onClick={() => handleRequestSort('quantity')}
                sx={{ cursor: 'pointer' }}
              >
                <TableSortLabel
                  active={orderBy === 'quantity'}
                  direction={orderBy === 'quantity' ? order : 'desc'}
                >
                  Quantity
                </TableSortLabel>
              </TableCell>
              <TableCell>Unit</TableCell>
              <TableCell
                sortDirection={orderBy === 'location' ? order : false}
                onClick={() => handleRequestSort('location')}
                sx={{ cursor: 'pointer' }}
              >
                <TableSortLabel
                  active={orderBy === 'location'}
                  direction={orderBy === 'location' ? order : 'asc'}
                >
                  Location
                </TableSortLabel>
              </TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'error.main' }}>
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              stableSort(filteredInventory, getComparator(order, orderBy)).map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {getLabelFromValue(categoryOptions, item.category)}
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center" justifyContent="flex-end">
                      {item.quantity} 
                      {item.quantity <= item.minStockLevel && (
                        <WarningIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getLabelFromValue(unitOptions, item.unit)}
                  </TableCell>
                  <TableCell>{item.location || 'N/A'}</TableCell>
                  <TableCell>
                    {item.expiryDate ? formatDate(item.expiryDate) : 'N/A'}
                    {item.expiryDate && daysUntilExpiry(item.expiryDate) !== null && (
                      <Typography variant="caption" display="block" color={daysUntilExpiry(item.expiryDate)! <= 7 ? 'error' : 'textSecondary'}>
                        {daysUntilExpiry(item.expiryDate)} days remaining
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenEditDialog(item)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteClick(item._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            ×
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Item Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                name="category"
                value={formData.category}
                label="Category"
                onChange={handleCategoryChange}
              >
                {categoryOptions.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Quantity"
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              inputProps={{ min: 0 }}
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="unit-label">Unit</InputLabel>
              <Select
                labelId="unit-label"
                id="unit"
                name="unit"
                value={formData.unit}
                label="Unit"
                onChange={handleUnitChange}
              >
                {unitOptions.map((unit) => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Price Per Unit"
              type="number"
              name="pricePerUnit"
              value={formData.pricePerUnit}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              label="Minimum Stock Level"
              type="number"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              inputProps={{ min: 1 }}
              helperText="Alert when quantity falls below this number"
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="location-label">Location</InputLabel>
              <Select
                labelId="location-label"
                id="location"
                name="location"
                value={formData.location}
                label="Location"
                onChange={handleLocationChange}
              >
                {locations.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Barcode"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Expiry Date"
                value={formData.expiryDate ? new Date(formData.expiryDate) : null}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal' as const,
                    helperText: 'Leave empty if not applicable'
                  }
                }}
              />
            </LocalizationProvider>
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              placeholder="Enter item description..."
            />
            <TextField
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              multiline
              rows={2}
              placeholder="Any additional notes..."
            />
            <DialogActions sx={{ px: 0, pb: 0 }}>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button 
                type="submit"
                variant="contained" 
                color="primary"
                disabled={!formData.name || !formData.category || formData.quantity === 0 || !formData.location}
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this item? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventory;
