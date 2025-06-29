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
  CircularProgress,
  Container,
  TablePagination,
  Button
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'manager';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get the Firebase ID token for authentication
        const idToken = await currentUser.getIdToken();
        
        const response = await axios.get<ApiResponse<UsersResponse>>(
          `${API_BASE_URL}/api/users`,
          {
            headers: { 
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true,
            params: {
              page: page + 1,
              limit: rowsPerPage
            }
          }
        );
        
        if (response.data?.success) {
          const responseData = response.data.data;
          setUsers(responseData.users || []);
          setTotalUsers(responseData.total || 0);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch users');
        }
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.response?.data?.message || 'Failed to fetch users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, page, rowsPerPage]);

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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage user roles and permissions
          </Typography>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }} 
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}
        
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 2 }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow 
                      key={user._id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{user.name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <FormControl size="small" variant="outlined" fullWidth>
                          <Select
                            value={user.role}
                            onChange={(e: SelectChangeEvent) => 
                              handleRoleChange(user._id, e.target.value as 'user' | 'admin' | 'manager')
                            }
                            disabled={!isAdmin || user._id === currentUser?.uid}
                            sx={{ minWidth: 120 }}
                          >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outlined" 
                          size="small"
                          color="error"
                          disabled={user._id === currentUser?.uid}
                          sx={{ textTransform: 'none' }}
                        >
                          Deactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalUsers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Container>
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
