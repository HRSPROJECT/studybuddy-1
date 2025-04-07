import { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  Paper, 
  IconButton,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Stack,
  Tooltip
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

export default function FileUploader({ onFileUpload, onTextInput, processing }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  // Process the selected file
  const processFile = (file) => {
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

  // Handle file drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle dropped files
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Text input area */}
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={6}
        placeholder="Type your question here... You can ask about math equations, chemistry formulas, or any subject!"
        value={textInput}
        onChange={handleTextChange}
        disabled={processing}
        sx={{ 
          mb: 2.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
            }
          }
        }}
      />

      {/* File upload area with drag and drop */}
      <Paper
        variant="outlined"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'primary.light',
          borderRadius: 3,
          mb: 2,
          bgcolor: dragActive ? 'rgba(25, 118, 210, 0.04)' : 'background.default',
          position: 'relative',
          transition: 'all 0.3s ease',
          minHeight: '120px'
        }}
      >
        {/* Show image preview if available */}
        {imagePreview ? (
          <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
            <Box
              component="img" 
              src={imagePreview} 
              alt="Preview" 
              sx={{ 
                maxWidth: '100%', 
                maxHeight: '300px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'block',
                mx: 'auto'
              }}
              loading="lazy"
            />
            <IconButton
              size="small"
              onClick={handleRemoveFile}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,1)',
                },
                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ) : (
          /* Show file name if non-image file is uploaded */
          uploadedFile && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              width: '100%',
              mb: 2,
              p: 2,
              bgcolor: 'primary.light',
              borderRadius: 2,
              color: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '80%' }}>
                <InsertDriveFileIcon sx={{ mr: 1 }} />
                <Typography variant="body2" noWrap>
                  {uploadedFile.name}
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={handleRemoveFile}
                sx={{ color: 'white' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )
        )}

        {/* Upload button or processing indicator */}
        {processing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <CircularProgress size={30} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Processing your question...
            </Typography>
          </Box>
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

            {!uploadedFile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.light', mb: 1 }} />
                <Typography variant="body1" fontWeight={500} sx={{ mb: 0.5 }}>
                  Drag & drop an image here
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                  or
                </Typography>
              </Box>
            )}

            <label htmlFor="file-upload-input">
              <Button
                component="span"
                variant="contained"
                startIcon={<UploadFileIcon />}
                disabled={processing}
                sx={{
                  fontWeight: 500,
                  boxShadow: uploadedFile ? 0 : 1,
                  '&:hover': {
                    boxShadow: uploadedFile ? 0 : 2,
                  }
                }}
              >
                {uploadedFile ? 'Replace Image' : 'Browse Image'}
              </Button>
            </label>

            {!uploadedFile && (
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ mt: 1.5, textAlign: 'center', maxWidth: '80%' }}
              >
                Upload an image of your question, math equation, chemistry formula, or any academic content
              </Typography>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}