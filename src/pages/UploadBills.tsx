import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Bill } from '../types/bill';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Button, 
  Chip,
  Divider,
  Alert,
  Snackbar,
  List,
  ListItem
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  PictureAsPdf as PdfIcon, 
  Image as ImageIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

// Define API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface BillsResponse {
  data: Bill[];
  count: number;
}

const UploadBills: React.FC = () => {
  const { currentUser } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Helper function to get auth headers
  const getAuthHeader = useCallback(async () => {
    const token = await currentUser?.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, [currentUser]);

  // Fetch user's bills on component mount
  useEffect(() => {
    const fetchBills = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get<ApiResponse<BillsResponse>>('/api/bills', {
          headers: await getAuthHeader()
        });
        setBills(response.data.data.data);
      } catch (error) {
        console.error('Error fetching bills:', error);
        console.error('Failed to load bills');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBills();
  }, [currentUser, getAuthHeader]);

  // Handle file upload
  const onDrop = async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('receipt', file);

    setIsUploading(true);
    try {
      const response = await axios.post<ApiResponse<{ data: Bill }>>(
        '/api/bills/upload', 
        formData, 
        {
          headers: {
            ...(await getAuthHeader()),
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Add the new bill to the list
      setBills(prevBills => [response.data.data.data, ...prevBills]);
      setSnackbar({
        open: true,
        message: 'Bill uploaded and processed successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error uploading bill:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload bill. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: isUploading
  });
  
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({...prev, open: false}));
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon color="primary" />;
      case 'doc':
      case 'docx':
        return <DescriptionIcon color="info" />;
      default:
        return <DescriptionIcon color="action" />;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Bills
      </Typography>
      
      {/* Upload Zone */}
      <Paper 
        {...getRootProps()} 
        variant="outlined"
        sx={{
          p: 6,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: isUploading ? 'progress' : 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
          mb: 4
        }}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <Box>
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body1" sx={{ mt: 2 }}>Processing your bill...</Typography>
          </Box>
        ) : isDragActive ? (
          <Box>
            <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" color="primary">Drop the bill here</Typography>
          </Box>
        ) : (
          <Box>
            <CloudUploadIcon color="action" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>Drag & drop a bill here</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or click to select a file
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: JPG, PNG, PDF, DOC, DOCX (max 5MB)
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Bills List */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Your Bills</Typography>
        </Box>
        
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading your bills...</Typography>
          </Box>
        ) : bills.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No bills found. Upload your first bill above.</Typography>
          </Box>
        ) : (
          <List>
            {bills.map((bill) => (
              <React.Fragment key={bill._id}>
                <ListItem 
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    p: 2
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    flex: 1,
                    mb: { xs: 1, sm: 0 }
                  }}>
                    <Box sx={{ mr: 2, display: 'flex' }}>
                      {bill.receiptUrl ? renderFileIcon(bill.receiptUrl) : <DescriptionIcon />}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" component="div">
                        {bill.description || 'Untitled Bill'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(bill.date)} • {bill.category}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: { xs: '100%', sm: 'auto' },
                    mt: { xs: 1, sm: 0 }
                  }}>
                    <Typography variant="h6" sx={{ mr: 2, fontWeight: 'bold' }}>
                      {formatCurrency(bill.amount)}
                    </Typography>
                    <Box>
                      <Chip 
                        label={bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        color={
                          bill.status === 'approved' ? 'success' : 
                          bill.status === 'rejected' ? 'error' : 'warning'
                        }
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {bill.receiptUrl && (
                        <Button 
                          size="small" 
                          href={bill.receiptUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </Button>
                      )}
                    </Box>
                  </Box>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UploadBills;
