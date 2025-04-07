import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Divider, 
  CircularProgress,
  TextField,
  IconButton,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import FileUploader from './FileUploader';
import ArticleIcon from '@mui/icons-material/Article';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareIcon from '@mui/icons-material/Share';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { processImageWithGroq, getExplanationWithGemini, searchWebForExplanation } from '../services/aiService';
import { renderMathJax } from '../utils/mathJaxRenderer';

export default function ExplainTab() {
  const [conceptText, setConceptText] = useState('');
  const [conceptImage, setConceptImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [webResults, setWebResults] = useState([]);
  const [error, setError] = useState('');
  const [searchTerms, setSearchTerms] = useState([]);
  const [explanationHistory, setExplanationHistory] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [currentExplanationIndex, setCurrentExplanationIndex] = useState(null);
  const [sourcesExpanded, setSourcesExpanded] = useState({});
  const [copySuccess, setCopySuccess] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLaptop = useMediaQuery(theme.breakpoints.up('md'));
  const explanationRefs = useRef({});
  
  // Process MathJax on explanation changes
  useEffect(() => {
    explanationHistory.forEach((item, index) => {
      if (item.explanation && explanationRefs.current[index]) {
        renderMathJax(explanationRefs.current[index]);
      }
    });
  }, [explanationHistory]);

  // Handle file upload
  const handleFileUpload = (file) => {
    setConceptImage(file);
  };

  // Handle text input
  const handleTextInput = (text) => {
    setConceptText(text);
  };

  // Process concept with AI and web search
  const handleExplainConcept = async () => {
    if (!conceptText && !conceptImage) {
      setError('Please enter a concept or upload an image.');
      return;
    }

    setError('');
    setProcessing(true);
    
    try {
      // Step 1: Process concept with Groq AI to understand the content
      let extractedConcept = conceptText;
      let terms = [];

      if (conceptImage || conceptText) {
        const groqResult = await processImageWithGroq(conceptImage, conceptText);
        if (groqResult.extractedConcept) {
          extractedConcept = groqResult.extractedConcept;
        }
        if (groqResult.searchTerms && groqResult.searchTerms.length) {
          terms = groqResult.searchTerms;
          setSearchTerms(terms);
        }
      }

      // Step 2: Search the web for relevant information using multiple search terms
      const searchResults = await searchWebForExplanation(extractedConcept, terms);
      setWebResults(searchResults);

      // Step 3: Get detailed explanation from Gemini
      const geminiResponse = await getExplanationWithGemini(
        extractedConcept, 
        conceptImage, 
        searchResults
      );

      // Update history with the new concept and explanation
      const newEntry = {
        conceptText: conceptText,
        conceptImage: conceptImage ? URL.createObjectURL(conceptImage) : null,
        extractedConcept: extractedConcept !== conceptText ? extractedConcept : null,
        explanation: geminiResponse,
        webResults: searchResults,
        searchTerms: terms,
        timestamp: new Date().toISOString()
      };

      setExplanationHistory([...explanationHistory, newEntry]);
      setExplanation(geminiResponse);
      
      // Clear the inputs for a new concept
      setConceptText('');
      setConceptImage(null);

      // Auto-expand first search result for better UX
      if (searchResults && searchResults.length > 0) {
        setSourcesExpanded({
          ...sourcesExpanded,
          [explanationHistory.length]: true
        });
      }
    } catch (err) {
      console.error('Error processing concept:', err);
      setError('An error occurred while processing your request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle menu open for actions
  const handleMenuOpen = (event, index) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentExplanationIndex(index);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setCurrentExplanationIndex(null);
  };

  // Copy explanation to clipboard
  const handleCopyExplanation = () => {
    if (currentExplanationIndex !== null) {
      const textToCopy = explanationHistory[currentExplanationIndex].explanation;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopySuccess(currentExplanationIndex);
          setTimeout(() => setCopySuccess(null), 2000);
        })
        .catch(err => console.error('Error copying text: ', err));
    }
    handleMenuClose();
  };

  // Export explanation as PDF
  const handleExportPDF = () => {
    if (currentExplanationIndex === null) return;
    
    const entry = explanationHistory[currentExplanationIndex];
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text('StudyBuddy - Concept Explanation', 20, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const date = new Date(entry.timestamp || new Date()).toLocaleString();
    doc.text(`Generated: ${date}`, 20, 27);
    
    // Add concept
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Concept:', 20, 35);
    
    const conceptText = entry.extractedConcept || entry.conceptText;
    doc.setFontSize(12);
    doc.setTextColor(33, 33, 33);
    doc.setFontStyle('bold');
    const conceptLines = doc.splitTextToSize(conceptText, 170);
    doc.text(conceptLines, 20, 42);
    
    // Add search terms if available
    if (entry.searchTerms && entry.searchTerms.length > 0) {
      let yPosition = 42 + (conceptLines.length * 6) + 5;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFontStyle('normal');
      doc.text('Research keywords: ' + entry.searchTerms.join(', '), 20, yPosition);
      yPosition += 10;
    } else {
      let yPosition = 42 + (conceptLines.length * 6) + 10;
    }
    
    // Add explanation
    let yPosition = 42 + (conceptLines.length * 6) + 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFontStyle('bold');
    doc.text('Explanation:', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(11);
    doc.setTextColor(33, 33, 33);
    doc.setFontStyle('normal');
    const explanationLines = doc.splitTextToSize(entry.explanation, 170);
    doc.text(explanationLines, 20, yPosition);
    
    // Add sources if available
    if (entry.webResults && entry.webResults.length > 0) {
      yPosition += (explanationLines.length * 6) + 10;
      
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
      
      entry.webResults.forEach((source, idx) => {
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
    doc.save(`studybuddy-explanation-${new Date().getTime()}.pdf`);
    
    handleMenuClose();
  };

  // Handle expand/collapse of sources
  const toggleSources = (index) => {
    setSourcesExpanded({
      ...sourcesExpanded,
      [index]: !sourcesExpanded[index]
    });
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

      {/* Concept input area */}
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
          <ScienceIcon fontSize="small" /> Explain a Concept
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 2.5 }}
        >
          Enter a concept or topic you want to understand better, or upload an image. Our AI will research the topic and provide a comprehensive explanation with proper citations.
        </Typography>
        
        <FileUploader
          onFileUpload={handleFileUpload}
          onTextInput={handleTextInput}
          processing={processing}
        />
        
        <Button
          fullWidth
          variant="contained"
          onClick={handleExplainConcept}
          disabled={processing || (!conceptText && !conceptImage)}
          startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}
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
          {processing ? 'Researching...' : 'Explain This Concept'}
        </Button>
      </Paper>

      {/* Display explanation history */}
      {explanationHistory.length > 0 && (
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
            <ArticleIcon fontSize="small" /> Explanations
          </Typography>
          
          {explanationHistory.map((entry, index) => (
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
              {/* Concept section */}
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 1
                }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    Concept:
                  </Typography>

                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ display: { xs: 'none', sm: 'block' } }}
                  >
                    {new Date(entry.timestamp || new Date()).toLocaleString()}
                  </Typography>
                </Box>

                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 1.5,
                    fontWeight: 500
                  }}
                >
                  {entry.conceptText}
                </Typography>
                
                {/* Display concept image if available */}
                {entry.conceptImage && (
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
                      src={entry.conceptImage} 
                      alt="Concept" 
                      style={{ 
                        maxWidth: '100%', 
                        display: 'block'
                      }}
                      loading="lazy"
                    />
                  </Box>
                )}
                
                {/* Show extracted concept if different */}
                {entry.extractedConcept && (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 2,
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      <strong>Identified Concept:</strong> {entry.extractedConcept}
                    </Typography>
                  </Alert>
                )}
                
                {/* Display search terms used for research */}
                {entry.searchTerms && entry.searchTerms.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      Research keywords:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {entry.searchTerms.map((term, idx) => (
                        <Chip 
                          key={idx} 
                          label={term} 
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            fontWeight: 500,
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
              
              <Divider />
              
              {/* Explanation section */}
              <Box 
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  bgcolor: 'background.paper',
                  position: 'relative'
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1.5
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.dark',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    Explanation:
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

                {/* Explanation text with MathJax rendering */}
                <Box 
                  ref={el => explanationRefs.current[index] = el}
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
                  {entry.explanation}
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
              
              {/* Web search results / Sources */}
              {entry.webResults && entry.webResults.length > 0 && (
                <Box>
                  <Divider />
                  
                  <Box 
                    onClick={() => toggleSources(index)}
                    sx={{ 
                      p: { xs: 2, sm: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography 
                        sx={{ 
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center' 
                        }}
                      >
                        Sources
                        <Chip 
                          label={entry.webResults.length} 
                          size="small" 
                          sx={{ 
                            ml: 1, 
                            height: 20, 
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }} 
                        />
                      </Typography>
                    </Box>
                    <ExpandMoreIcon 
                      sx={{ 
                        transform: sourcesExpanded[index] ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s'
                      }} 
                    />
                  </Box>
                  
                  {sourcesExpanded[index] && (
                    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.paper' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        The explanation above was generated using information from these sources:
                      </Typography>
                      
                      <List disablePadding>
                        {entry.webResults.map((result, idx) => (
                          <ListItem 
                            key={idx} 
                            alignItems="flex-start"
                            disablePadding
                            sx={{ 
                              mb: 2,
                              pb: 2,
                              borderBottom: idx < entry.webResults.length - 1 ? '1px solid #eee' : 'none',
                              display: 'block'
                            }}
                          >
                            <Box sx={{ display: 'flex', mb: 0.5 }}>
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
                                    variant="subtitle2" 
                                    sx={{ 
                                      fontWeight: 'bold',
                                      color: 'primary.main' 
                                    }}
                                  >
                                    {result.title}
                                  </Typography>
                                }
                                disableTypography
                              />
                            </Box>
                            
                            <Box sx={{ ml: 4.5, mb: 1 }}>
                              <Typography variant="body2">
                                {result.snippet}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ ml: 4.5, display: 'flex', alignItems: 'center' }}>
                              <LinkIcon 
                                fontSize="small"
                                sx={{ 
                                  fontSize: '1rem',
                                  mr: 0.5,
                                  color: 'primary.main',
                                  opacity: 0.7
                                }}
                              />
                              <Typography 
                                variant="caption"
                                component="a"
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ 
                                  color: 'primary.main',
                                  textDecoration: 'none',
                                  '&:hover': {
                                    textDecoration: 'underline'
                                  }
                                }}
                              >
                                {result.url}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
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
        <MenuItem onClick={handleCopyExplanation}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy explanation" />
        </MenuItem>
        
        {isLaptop && (
          <MenuItem onClick={handleExportPDF}>
            <ListItemIcon>
              <PictureAsPdfIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Export as PDF" />
          </MenuItem>
        )}
        
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Share" />
        </MenuItem>
      </Menu>
    </Box>
  );
}