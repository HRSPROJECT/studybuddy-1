import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Menu,
  MenuItem,
  Alert,
  Tooltip,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import HelpIcon from '@mui/icons-material/Help';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HistoryIcon from '@mui/icons-material/History';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import FileUploader from './FileUploader';
import { renderMathJax } from '../utils/mathJaxRenderer';
import { answerQuestionWithAI, searchWebForResults } from '../services/aiService';

export default function AskTab() {
  const [question, setQuestion] = useState('');
  const [questionImage, setQuestionImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [error, setError] = useState('');
  const [questionHistory, setQuestionHistory] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [savedQuestions, setSavedQuestions] = useState({});
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLaptop = useMediaQuery(theme.breakpoints.up('md'));
  const answerRefs = useRef({});
  
  // Process MathJax on answer changes
  useEffect(() => {
    questionHistory.forEach((item, index) => {
      if (item.answer && answerRefs.current[index]) {
        renderMathJax(answerRefs.current[index]);
      }
    });
  }, [questionHistory]);

  // Handle file upload
  const handleFileUpload = (file) => {
    setQuestionImage(file);
  };

  // Handle text input
  const handleTextInput = (text) => {
    setQuestion(text);
  };

  // Submit question for processing
  const handleSubmitQuestion = async () => {
    if (!question && !questionImage) {
      setError('Please enter a question or upload an image.');
      return;
    }

    setError('');
    setProcessing(true);
    
    try {
      // Search the web for relevant information
      const searchResults = await searchWebForResults(question);
      setSources(searchResults);

      // Get answer from AI with the search results for context
      const aiResponse = await answerQuestionWithAI(
        question,
        questionImage,
        searchResults
      );

      // Update history with the new question and answer
      const newEntry = {
        question: question,
        questionImage: questionImage ? URL.createObjectURL(questionImage) : null,
        answer: aiResponse,
        sources: searchResults,
        timestamp: new Date().toISOString()
      };

      setQuestionHistory(prevHistory => [...prevHistory, newEntry]);
      setAnswer(aiResponse);
      
      // Reset inputs for a new question
      setQuestion('');
      setQuestionImage(null);
    } catch (err) {
      console.error('Error processing question:', err);
      setError('An error occurred while processing your request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle keypress for submitting with Enter
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmitQuestion();
    }
  };

  // Handle menu open for actions
  const handleMenuOpen = (event, index) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentQuestionIndex(index);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setCurrentQuestionIndex(null);
  };

  // Copy answer to clipboard
  const handleCopyAnswer = () => {
    if (currentQuestionIndex !== null) {
      const textToCopy = questionHistory[currentQuestionIndex].answer;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopySuccess(currentQuestionIndex);
          setTimeout(() => setCopySuccess(null), 2000);
        })
        .catch(err => console.error('Error copying text: ', err));
    }
    handleMenuClose();
  };

  // Toggle question as saved/bookmark
  const toggleSaveQuestion = (index) => {
    setSavedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Export answer as PDF
  const handleExportPDF = () => {
    if (currentQuestionIndex === null) return;
    
    const entry = questionHistory[currentQuestionIndex];
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text('StudyBuddy - Q&A', 20, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const date = new Date(entry.timestamp || new Date()).toLocaleString();
    doc.text(`Generated: ${date}`, 20, 27);
    
    // Add question
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Question:', 20, 35);
    
    doc.setFontSize(12);
    doc.setTextColor(33, 33, 33);
    doc.setFontStyle('bold');
    const questionLines = doc.splitTextToSize(entry.question, 170);
    doc.text(questionLines, 20, 42);
    
    // Add answer
    let yPosition = 42 + (questionLines.length * 6) + 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFontStyle('bold');
    doc.text('Answer:', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(11);
    doc.setTextColor(33, 33, 33);
    doc.setFontStyle('normal');
    const answerLines = doc.splitTextToSize(entry.answer, 170);
    doc.text(answerLines, 20, yPosition);
    
    // Add sources if available
    if (entry.sources && entry.sources.length > 0) {
      yPosition += (answerLines.length * 6) + 10;
      
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFontStyle('bold');
      doc.text('Sources:', 20, yPosition);
      
      yPosition += 7;
      
      entry.sources.forEach((source, idx) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.setFontStyle('bold');
        doc.text(`${idx + 1}. ${source.title}`, 20, yPosition);
        
        yPosition += 5;
        
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 238); // Link blue color
        doc.setFontStyle('normal');
        doc.text(source.url, 25, yPosition);
        
        yPosition += 8;
      });
    }
    
    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated by StudyBuddy - AI Learning Assistant', 20, 290);
    
    // Save the PDF
    doc.save(`studybuddy-qa-${new Date().getTime()}.pdf`);
    
    handleMenuClose();
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Show error if any */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            boxShadow: '0 2px 6px rgba(211, 47, 47, 0.2)'
          }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Question input area */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid rgba(25, 118, 210, 0.1)',
        }}
      >
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            color: 'primary.dark',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <HelpIcon fontSize="small" /> Ask a Question
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 2.5 }}
        >
          Ask any academic or study-related question. You can also upload an image of a problem to solve. Our AI will research and provide a detailed answer with citations.
        </Typography>
        
        <FileUploader
          onFileUpload={handleFileUpload}
          onTextInput={handleTextInput}
          textLabel="Your question"
          textPlaceholder="Type your question here..."
          processing={processing}
        />
        
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmitQuestion}
          disabled={processing || (!question && !questionImage)}
          startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          sx={{ 
            mt: 2.5,
            py: 1,
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4
            }
          }}
        >
          {processing ? 'Processing...' : 'Get Answer'}
        </Button>
      </Paper>

      {/* Display question & answer history */}
      {questionHistory.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              mb: 2,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center', 
              gap: 1
            }}
          >
            <HistoryIcon fontSize="small" /> Recent Questions
          </Typography>
          
          {questionHistory.map((entry, index) => (
            <Paper 
              key={index} 
              elevation={2} 
              sx={{ 
                mb: 3, 
                borderRadius: 3,
                bgcolor: 'white',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                overflow: 'hidden'
              }}
            >
              {/* Question section */}
              <Box sx={{ 
                p: { xs: 2, sm: 3 },
                bgcolor: 'rgba(25, 118, 210, 0.04)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ fontWeight: 'bold', color: '#333' }}
                    >
                      Question:
                    </Typography>
                    
                    <Tooltip title={savedQuestions[index] ? "Remove bookmark" : "Bookmark this question"}>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleSaveQuestion(index)}
                        sx={{ ml: 1, color: savedQuestions[index] ? 'warning.main' : 'action.disabled' }}
                      >
                        {savedQuestions[index] ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: { xs: 'none', sm: 'block' } }}
                    >
                      {new Date(entry.timestamp || new Date()).toLocaleString()}
                    </Typography>
                    
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, index)}
                      sx={{ ml: 1 }}
                      aria-label="More options"
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Typography 
                  variant="body1" 
                  sx={{ 
                    mt: 1,
                    mb: 1.5,
                    fontWeight: 500
                  }}
                >
                  {entry.question}
                </Typography>
                
                {/* Display question image if available */}
                {entry.questionImage && (
                  <Box 
                    sx={{ 
                      mb: 2, 
                      maxWidth: { xs: '100%', sm: '400px' },
                      border: '1px solid #eaeaea',
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <img 
                      src={entry.questionImage} 
                      alt="Question" 
                      style={{ 
                        maxWidth: '100%', 
                        display: 'block'
                      }}
                      loading="lazy"
                    />
                  </Box>
                )}
              </Box>
              
              <Divider />
              
              {/* Answer section */}
              <Box 
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  bgcolor: 'background.paper',
                  position: 'relative'
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 1.5,
                    fontWeight: 'bold',
                    color: 'primary.dark'
                  }}
                >
                  Answer:
                </Typography>

                {/* Answer text with MathJax rendering */}
                <Box 
                  ref={el => answerRefs.current[index] = el}
                  sx={{ 
                    typography: 'body1',
                    lineHeight: 1.7,
                    '& code': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                      p: 0.5,
                      borderRadius: 1,
                      fontFamily: 'monospace'
                    },
                    '& pre': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                      p: 1.5,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontFamily: 'monospace'
                    },
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      mt: 2,
                      mb: 1,
                      fontWeight: 600
                    },
                    '& ul, & ol': {
                      pl: 2
                    },
                    '& img': {
                      maxWidth: '100%',
                      borderRadius: 1
                    }
                  }}
                >
                  {entry.answer}
                </Box>

                {copySuccess === index && (
                  <Alert 
                    severity="success" 
                    variant="filled"
                    sx={{ 
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      boxShadow: 3
                    }}
                  >
                    Copied to clipboard!
                  </Alert>
                )}
              </Box>
              
              {/* Sources section */}
              {entry.sources && entry.sources.length > 0 && (
                <>
                  <Divider />
                  <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 2,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <InfoOutlinedIcon 
                        fontSize="small" 
                        sx={{ mr: 1, color: 'text.secondary' }} 
                      />
                      Sources
                      <Chip 
                        label={entry.sources.length} 
                        size="small" 
                        sx={{ 
                          ml: 1, 
                          height: 20, 
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }} 
                      />
                    </Typography>
                    
                    <List dense disablePadding>
                      {entry.sources.slice(0, 3).map((source, idx) => (
                        <ListItem 
                          key={idx} 
                          disablePadding
                          sx={{ mb: 1 }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Chip
                              label={idx + 1}
                              size="small"
                              sx={{
                                fontWeight: 'bold',
                                bgcolor: 'primary.light',
                                color: 'white'
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography 
                                variant="body2" 
                                component="a"
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ 
                                  fontWeight: 500,
                                  color: 'primary.main',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  '&:hover': {
                                    textDecoration: 'underline'
                                  }
                                }}
                              >
                                {source.title}
                                <LinkIcon 
                                  fontSize="small"
                                  sx={{ 
                                    ml: 0.5,
                                    fontSize: '0.8rem'
                                  }}
                                />
                              </Typography>
                            }
                            secondary={
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {source.url}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                      
                      {entry.sources.length > 3 && (
                        <Typography 
                          variant="body2" 
                          color="primary" 
                          sx={{ 
                            pl: 4.5, 
                            mt: 1, 
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          +{entry.sources.length - 3} more sources
                        </Typography>
                      )}
                    </List>
                  </Box>
                </>
              )}
            </Paper>
          ))}
        </Box>
      )}

      {/* Actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 200
          }
        }}
      >
        <MenuItem onClick={handleCopyAnswer}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy answer" />
        </MenuItem>
        
        {isLaptop && (
          <MenuItem onClick={handleExportPDF}>
            <ListItemIcon>
              <PictureAsPdfIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Export as PDF" />
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          toggleSaveQuestion(currentQuestionIndex);
          handleMenuClose();
        }}>
          <ListItemIcon>
            {savedQuestions[currentQuestionIndex] ? 
              <BookmarkIcon fontSize="small" /> : 
              <BookmarkBorderIcon fontSize="small" />
            }
          </ListItemIcon>
          <ListItemText 
            primary={savedQuestions[currentQuestionIndex] ? 
              "Remove bookmark" : 
              "Bookmark question"
            } 
          />
        </MenuItem>
      </Menu>
    </Box>
  );
}