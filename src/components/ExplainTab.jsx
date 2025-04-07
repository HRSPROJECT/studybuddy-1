import { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Divider, 
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import FileUploader from './FileUploader';
import { processImageWithGroq, getExplanationWithGemini, searchWebForExplanation } from '../services/aiService';

export default function ExplainTab() {
  const [conceptText, setConceptText] = useState('');
  const [conceptImage, setConceptImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [webResults, setWebResults] = useState([]);
  const [error, setError] = useState('');
  const [researchKeywords, setResearchKeywords] = useState([]);

  // Handle file upload
  const handleFileUpload = (file) => {
    setConceptImage(file);
  };

  // Handle text input
  const handleTextInput = (text) => {
    setConceptText(text);
  };

  // Process request with AI and web search
  const handleGetExplanation = async () => {
    if (!conceptText && !conceptImage) {
      setError('Please enter text or upload an image to explain.');
      return;
    }

    setError('');
    setProcessing(true);
    
    try {
      // Step 1: Process content with Groq AI for understanding the concept/image
      let extractedConcept = conceptText;
      let searchTerms = [];

      if (conceptImage) {
        const groqResult = await processImageWithGroq(conceptImage, conceptText);
        
        if (groqResult.extractedConcept) {
          extractedConcept = groqResult.extractedConcept;
        }
        
        if (groqResult.searchTerms && groqResult.searchTerms.length) {
          searchTerms = groqResult.searchTerms;
          setResearchKeywords(groqResult.searchTerms);
        }
      } else if (conceptText) {
        // Generate search terms from text only
        searchTerms = conceptText.split(' ')
          .filter(term => term.length > 3)
          .slice(0, 5);
        setResearchKeywords(searchTerms);
      }

      // Step 2: Search the web for each search term to get comprehensive information
      const combinedSearchResults = await searchWebForExplanation(extractedConcept, searchTerms);
      setWebResults(combinedSearchResults);

      // Step 3: Get final explanation from Gemini
      const geminiResponse = await getExplanationWithGemini(
        extractedConcept,
        conceptImage,
        combinedSearchResults
      );

      setExplanation(geminiResponse);
    } catch (err) {
      console.error('Error processing explanation request:', err);
      setError('An error occurred while generating your explanation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Show error if any */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Input area */}
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Get an Explanation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload an image and/or enter text about the concept you want explained. Our AI will conduct research and provide a detailed explanation.
        </Typography>
        
        <FileUploader
          onFileUpload={handleFileUpload}
          onTextInput={handleTextInput}
          processing={processing}
        />
        
        <Button
          fullWidth
          variant="contained"
          onClick={handleGetExplanation}
          disabled={processing || (!conceptText && !conceptImage)}
          startIcon={processing ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
          sx={{ mt: 2 }}
        >
          {processing ? 'Researching...' : 'Get Explanation'}
        </Button>
      </Paper>

      {/* Display explanation results */}
      {explanation && (
        <Box sx={{ mb: 3 }}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            {/* Research keywords */}
            {researchKeywords.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Research Keywords:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {researchKeywords.map((keyword, idx) => (
                    <Paper
                      key={idx}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: 'primary.light',
                        color: 'white',
                        borderRadius: 4
                      }}
                    >
                      <Typography variant="body2">
                        {keyword}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
            
            <Typography variant="h6" gutterBottom>
              Explanation
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Explanation content */}
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {explanation}
            </Typography>
            
            {/* Web search results */}
            {webResults && webResults.length > 0 && (
              <Accordion sx={{ mt: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                    Research Sources
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    The explanation above was generated using information from these sources:
                  </Typography>
                  {webResults.map((result, idx) => (
                    <Box key={idx} sx={{ mb: 2, pb: 2, borderBottom: idx < webResults.length - 1 ? '1px solid #eee' : 'none' }}>
                      <Typography variant="subtitle2">{result.title}</Typography>
                      <Typography variant="body2">{result.snippet}</Typography>
                      <Typography 
                        variant="caption"
                        component="a"
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main', display: 'block' }}
                      >
                        {result.url}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}