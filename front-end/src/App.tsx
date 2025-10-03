import { useState, useCallback } from 'react';
import { Box, Button, Container, CssBaseline, Typography, Paper, styled, Stack, TextField } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import BillView from './pages/BillView';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('bill', selectedFile);

    try {
      const response = await fetch('http://localhost:8080/api/receipts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      // Navigate to the bill view using returned unique ID
      if (result?.id) {
        navigate(`/bill/${result.id}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload bill. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile]);

  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Bill Splitting Dashboard
          </Typography>
          
          <Paper 
            elevation={3} 
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: '60vh',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {selectedFile ? selectedFile.name : 'Upload your bill'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Drag and drop your bill here, or click to select a file
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                disabled={isUploading}
              >
                Choose File
                <VisuallyHiddenInput 
                  type="file" 
                  onChange={handleFileChange} 
                  accept="image/*,.pdf"
                />
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Bill'}
              </Button>
            </Box>
            
            {selectedFile && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                {`File: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`}
              </Typography>
            )}
          </Paper>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Open Bill</Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mt: 4, width: '100%', maxWidth: 600 }}>
              <TextField fullWidth size="small" label="Enter Bill ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && searchId.trim()) navigate(`/bill/${searchId.trim()}`); }} />
              <Button variant="outlined" onClick={() => { if (searchId.trim()) navigate(`/bill/${searchId.trim()}`); }}>Open</Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bill/:id" element={<BillView />} />
    </Routes>
  )
}

export default App;
