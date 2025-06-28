import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  SelectChangeEvent, 
  Snackbar, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'manager';
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { currentUser, isAdmin } = useAuth();
  // No need to initialize auth here as we're using it from useAuth

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Get the Firebase ID token for authentication
        const idToken = await currentUser.getIdToken();
        
        interface ApiResponse {
          success: boolean;
          data: User[];
          message?: string;
        }

        const response = await axios.get<ApiResponse>('/api/users', {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (response.data?.success && Array.isArray(response.data.data)) {
          setUsers(response.data.data);
        } else {
          throw new Error(response.data?.message || 'Invalid response format');
        }
      } catch (err) {
        setError('Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'manager') => {
    if (!currentUser) {
      setError('You must be logged in to perform this action');
      return;
    }

    try {
      // Get a fresh ID token
      const idToken = await currentUser.getIdToken();
      
      interface UpdateRoleResponse {
        success: boolean;
        data?: User;
        message?: string;
      }

      await axios.put<UpdateRoleResponse>(
        `/api/users/${userId}/role`,
        { role: newRole },
        { 
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      
      setSuccess('User role updated successfully');
    } catch (err) {
      setError('Failed to update user role. You may not have sufficient permissions.');
      console.error('Error updating user role:', err);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          You must be logged in to view this page.
        </Typography>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          You do not have permission to access this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <FormControl variant="outlined" size="small">
                    <Select
                      value={user.role}
                      onChange={(e: SelectChangeEvent) => 
                        handleRoleChange(user._id, e.target.value as 'user' | 'admin' | 'manager')
                      }
                      disabled={user.role === 'admin'}
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  {/* Add action buttons here if needed */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar 
        open={!!error || !!success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
