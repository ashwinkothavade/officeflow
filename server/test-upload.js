const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Replace with a valid JWT token from your application
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

async function testFileUpload() {
  try {
    const form = new FormData();
    
    // Path to a test receipt image (update this path to point to a real image file)
    const filePath = path.join(__dirname, 'test-receipt.jpg');
    
    // Check if test file exists
    if (!fs.existsSync(filePath)) {
      console.error('Test file not found. Please create a test receipt image at:', filePath);
      return;
    }
    
    form.append('receipt', fs.createReadStream(filePath));
    
    console.log('Uploading test file...');
    
    const response = await axios.post('http://localhost:5000/api/bills/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log('Upload successful! Response:', response.data);
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

// Run the test
testFileUpload();
