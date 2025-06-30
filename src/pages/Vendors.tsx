import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
}

interface Vendor {
  _id: string;
  name: string;
  email: string;
  mobileNumber: string;
  category: string;
  address?: string;
  description?: string;
  createdAt: string;
}

interface VendorForm {
  name: string;
  email: string;
  mobileNumber: string;
  category: string;
  address: string;
  description: string;
}

const Vendors: React.FC = () => {
  const { currentUser } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorForm>({
    name: '',
    email: '',
    mobileNumber: '',
    category: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<Vendor[]>>('/vendors');
      setVendors(response.data.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = () => {
    setSelectedVendor(null);
    setFormData({
      name: '',
      email: '',
      mobileNumber: '',
      category: '',
      address: '',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      mobileNumber: vendor.mobileNumber,
      category: vendor.category,
      address: vendor.address || '',
      description: vendor.description || ''
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedVendor) {
        // Create new vendor
        await api.post('/vendors', formData);
      } else {
        // Update existing vendor
        await api.put(`/vendors/${selectedVendor._id}`, formData);
      }
      await fetchVendors();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving vendor:', error);
      setError('Failed to save vendor');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await api.delete(`/vendors/${vendorId}`);
        await fetchVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
        setError('Failed to delete vendor');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!currentUser) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          You must be logged in to view this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vendors Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your vendors and their details
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddVendor}
        >
          Add New Vendor
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile Number</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor._id}>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.mobileNumber}</TableCell>
                  <TableCell>{vendor.category}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleEditVendor(vendor)}
                      color="primary"
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteVendor(vendor._id)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              label="Mobile Number"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={4}
            />
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {selectedVendor ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Vendors;
