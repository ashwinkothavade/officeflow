import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import { CloudUpload, Close } from '@mui/icons-material';
import { uploadBill, BillData } from '../services/billService';

interface BillUploadProps {
  onUploadSuccess?: (billData: BillData) => void;
  onClose?: () => void;
  open: boolean;
}

const BillUpload: React.FC<BillUploadProps> = ({ onUploadSuccess, onClose, open }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [billData, setBillData] = useState<Partial<BillData>>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    // Set preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Process the file
    handleFileUpload(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      
      const result = await uploadBill(file);
      setBillData(result);
      setSuccess(true);
      
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      console.error('Error uploading bill:', err);
      setError(err instanceof Error ? err.message : 'Failed to process bill');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setPreview(null);
    setBillData({});
    if (onClose) onClose();
  };

  const handleInputChange = (field: keyof BillData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBillData((prev: Partial<BillData>) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const expenseCategories = [
    'Office Supplies',
    'Food & Beverage',
    'Travel',
    'Utilities',
    'Rent',
    'Equipment',
    'Software',
    'Marketing',
    'Other'
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Bill or Receipt</DialogTitle>
      <DialogContent>
        {!success ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <div
              {...getRootProps()}
              style={{
                border: '2px dashed #ccc',
                borderRadius: '4px',
                padding: '40px 20px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.7 : 1,
                backgroundColor: isDragActive ? '#f5f5f5' : 'transparent',
                transition: 'background-color 0.2s',
              }}
            >
              <input {...getInputProps()} disabled={isUploading} />
              {isUploading ? (
                <Box>
                  <CircularProgress />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Processing your bill...
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <CloudUpload fontSize="large" color="action" />
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a bill or receipt here'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Supported formats: JPG, PNG, PDF
                  </Typography>
                  <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                    Select File
                  </Button>
                </Box>
              )}
            </div>

            {preview && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Preview
                </Typography>
                <img 
                  src={preview} 
                  alt="Bill preview" 
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} 
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bill Details
            </Typography>
            
            <TextField
              fullWidth
              margin="normal"
              label="Amount"
              type="number"
              value={billData.amount || ''}
              onChange={handleInputChange('amount')}
              InputProps={{
                startAdornment: '₹ ',
              }}
            />
            
            <TextField
              select
              fullWidth
              margin="normal"
              label="Category"
              value={billData.category || ''}
              onChange={handleInputChange('category')}
            >
              {expenseCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              fullWidth
              margin="normal"
              label="Date"
              type="date"
              value={billData.date || ''}
              onChange={handleInputChange('date')}
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Vendor"
              value={billData.vendor || ''}
              onChange={handleInputChange('vendor')}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              multiline
              rows={3}
              value={billData.description || ''}
              onChange={handleInputChange('description')}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {success ? (
          <>
            <Button onClick={handleClose} color="primary">
              Done
            </Button>
            <Button 
              onClick={() => {
                // Save the updated bill data
                // You can implement this based on your requirements
                if (onUploadSuccess) {
                  onUploadSuccess(billData as BillData);
                }
                handleClose();
              }} 
              color="primary" 
              variant="contained"
            >
              Save
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
        )}
      </DialogActions>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BillUpload;
