import { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  Paper, 
  IconButton,
  CircularProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';

export default function FileUploader({ onFileUpload, onTextInput, processing }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      
      // Create image preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      }
      
      // Call the parent component's handler
      onFileUpload(file);
    }
  };

  // Handle text input changes
  const handleTextChange = (event) => {
    setTextInput(event.target.value);
    onTextInput(event.target.value);
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileUpload(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Text input area */}
      <TextField
        fullWidth
        multiline
        minRows={3}
        maxRows={6}
        placeholder="Type your question here..."
        value={textInput}
        onChange={handleTextChange}
        disabled={processing}
        sx={{ mb: 2 }}
      />

      {/* File upload area */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed',
          borderColor: 'primary.light',
          borderRadius: 2,
          mb: 2,
          bgcolor: 'background.default',
          position: 'relative'
        }}
      >
        {/* Show image preview if available */}
        {imagePreview && (
          <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '300px',
                borderRadius: '8px'
              }} 
            />
            <IconButton
              size="small"
              onClick={handleRemoveFile}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        )}

        {/* Show file name if non-image file is uploaded */}
        {uploadedFile && !imagePreview && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            width: '100%',
            mb: 2,
            p: 1,
            bgcolor: 'primary.light',
            borderRadius: 1,
            color: 'white'
          }}>
            <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
              {uploadedFile.name}
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleRemoveFile}
              sx={{ color: 'white' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Upload button or processing indicator */}
        {processing ? (
          <CircularProgress size={30} />
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input">
              <Button
                component="span"
                variant="contained"
                startIcon={<UploadFileIcon />}
                disabled={processing}
              >
                {uploadedFile ? 'Replace Image' : 'Upload Image'}
              </Button>
            </label>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Upload an image of your question
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}