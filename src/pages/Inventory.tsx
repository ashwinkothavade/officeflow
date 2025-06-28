import React, { useState } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  
  // Sample data - replace with real data from your backend
  const [inventoryItems, setInventoryItems] = useState([
    { id: 1, name: 'Laptop', category: 'Electronics', quantity: 15, location: 'Storage A' },
    { id: 2, name: 'Desk Chair', category: 'Furniture', quantity: 25, location: 'Main Office' },
    { id: 3, name: 'Notebooks', category: 'Office Supplies', quantity: 100, location: 'Supply Closet' },
    { id: 4, name: 'Monitor', category: 'Electronics', quantity: 12, location: 'Storage A' },
  ]);

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    quantity: '',
    location: ''
  });

  const categories = ['Electronics', 'Furniture', 'Office Supplies', 'Stationery', 'IT Equipment', 'Other'];
  const locations = ['Storage A', 'Storage B', 'Main Office', 'Supply Closet', 'Warehouse', 'Other'];

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewItem({ name: '', category: '', quantity: '', location: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: name === 'quantity' ? (parseInt(value) || '') : value
    }));
  };

  const handleAddItem = () => {
    if (newItem.name && newItem.category && newItem.quantity !== '' && newItem.location) {
      const item = {
        id: inventoryItems.length > 0 ? Math.max(...inventoryItems.map(i => i.id)) + 1 : 1,
        name: newItem.name,
        category: newItem.category,
        quantity: parseInt(newItem.quantity as unknown as string),
        location: newItem.location
      };
      
      setInventoryItems([...inventoryItems, item]);
      handleClose();
    }
  };

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          onClick={handleOpen}
          sx={{ minWidth: '150px' }}
        >
          Add Item
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Inventory Summary</Typography>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <Box>
            <Typography variant="subtitle2">Total Items</Typography>
            <Typography variant="h5">{inventoryItems.length}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Categories</Typography>
            <Typography>3</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Low Stock</Typography>
            <Typography color="error">2 items</Typography>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Inventory Item
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Item Name"
              name="name"
              value={newItem.name}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Category"
              name="category"
              value={newItem.category}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantity"
              type="number"
              name="quantity"
              value={newItem.quantity}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              inputProps={{ min: 1 }}
            />
            <TextField
              select
              label="Location"
              name="location"
              value={newItem.location}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            >
              {locations.map((location) => (
                <MenuItem key={location} value={location}>
                  {location}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleAddItem} 
            variant="contained" 
            color="primary"
            disabled={!newItem.name || !newItem.category || newItem.quantity === '' || !newItem.location}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
