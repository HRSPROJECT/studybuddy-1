import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Divider, 
  CircularProgress,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import FileUploader from './FileUploader';
import { processQuestionWithGroq, getGeminiResponse, searchWeb } from '../services/aiService';

export default function AskTab() {
  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [webResults, setWebResults] = useState([]);
  const [error, setError] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [conversation, setConversation] = useState([]);

  // Handle file upload
  const handleFileUpload = (file) => {
    setQuestionImage(file);
  };

  // Handle text input
  const handleTextInput = (text) => {
    setQuestionText(text);
  };

  // Process question with AI and web search
  const handleSubmitQuestion = async () => {
    if (!questionText && !questionImage) {
      setError('Please enter a question or upload an image.');
      return;
    }

    setError('');
    setProcessing(true);
    
    try {
      // Step 1: Process question with Groq AI to understand the content
      let extractedQuestion = questionText;

      if (questionImage) {
        const groqResult = await processQuestionWithGroq(questionImage, questionText);
        if (groqResult.extractedQuestion) {
          extractedQuestion = groqResult.extractedQuestion;
        }
      }

      // Step 2: Search the web for relevant information
      const searchResults = await searchWeb(extractedQuestion);
      setWebResults(searchResults);

      // Step 3: Get final answer from Gemini
      const geminiResponse = await getGeminiResponse(
        extractedQuestion, 
        questionImage, 
        searchResults
      );

      // Update conversation with the new Q&A pair
      const newEntry = {
        questionText: questionText,
        questionImage: questionImage ? URL.createObjectURL(questionImage) : null,
        extractedQuestion: extractedQuestion !== questionText ? extractedQuestion : null,
        answer: geminiResponse,
        webResults: searchResults
      };

      setConversation([...conversation, newEntry]);
      setAnswer(geminiResponse);
      
      // Clear the inputs for a new question
      setQuestionText('');
      setQuestionImage(null);
    } catch (err) {
      console.error('Error processing question:', err);
      setError('An error occurred while processing your question. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle follow-up question
  const handleFollowUpSubmit = async () => {
    if (!followUpQuestion.trim()) return;

    setProcessing(true);
    
    try {
      // Build context from previous conversation
      const previousContext = conversation.map(entry => ({
        question: entry.extractedQuestion || entry.questionText,
        answer: entry.answer
      }));
      
      // Get follow-up answer from Gemini
      const followUpResponse = await getGeminiResponse(
        followUpQuestion,
        null,
        webResults,
        previousContext
      );

      // Add to conversation
      const newEntry = {
        questionText: followUpQuestion,
        answer: followUpResponse,
        isFollowUp: true
      };

      setConversation([...conversation, newEntry]);
      setFollowUpQuestion('');
    } catch (err) {
      console.error('Error processing follow-up question:', err);
      setError('An error occurred while processing your follow-up question.');
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

      {/* Question input area */}
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ask a Question
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload an image of your question and/or enter text. Our AI will analyze your question, search the web for accurate information, and provide a detailed answer.
        </Typography>
        
        <FileUploader
          onFileUpload={handleFileUpload}
          onTextInput={handleTextInput}
          processing={processing}
        />
        
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmitQuestion}
          disabled={processing || (!questionText && !questionImage)}
          startIcon={processing ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
          sx={{ mt: 2 }}
        >
          {processing ? 'Processing...' : 'Get Answer'}
        </Button>
      </Paper>

      {/* Display conversation history */}
      {conversation.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Conversation
          </Typography>
          
          {conversation.map((entry, index) => (
            <Paper 
              key={index} 
              elevation={1} 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: entry.isFollowUp ? 'rgba(25, 118, 210, 0.05)' : 'white'
              }}
            >
              {/* Question section */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: entry.isFollowUp ? 'primary.main' : 'text.primary' 
                  }}
                >
                  {entry.isFollowUp ? 'Follow-up Question:' : 'Question:'}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {entry.questionText}
              </Typography>
              
              {/* Display question image if available */}
              {entry.questionImage && (
                <Box sx={{ mb: 2, maxWidth: '300px' }}>
                  <img 
                    src={entry.questionImage} 
                    alt="Question" 
                    style={{ 
                      maxWidth: '100%', 
                      borderRadius: '8px', 
                      border: '1px solid #e0e0e0' 
                    }} 
                  />
                </Box>
              )}
              
              {/* Show extracted question if different */}
              {entry.extractedQuestion && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Extracted Question:</strong> {entry.extractedQuestion}
                  </Typography>
                </Alert>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              {/* Answer section */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Answer:
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {entry.answer}
              </Typography>
              
              {/* Web search results if available */}
              {entry.webResults && entry.webResults.length > 0 && (
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                      Web Search Results
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {entry.webResults.map((result, idx) => (
                      <Box key={idx} sx={{ mb: 2 }}>
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
          ))}
        </Box>
      )}

      {/* Follow-up question input */}
      {conversation.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Have a follow-up question?
          </Typography>
          <Box sx={{ display: 'flex' }}>
            <TextField
              fullWidth
              placeholder="Ask a follow-up question..."
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              disabled={processing}
              sx={{ mr: 1 }}
            />
            <IconButton 
              color="primary" 
              onClick={handleFollowUpSubmit} 
              disabled={processing || !followUpQuestion.trim()}
            >
              {processing ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Paper>
      )}
    </Box>
  );
}