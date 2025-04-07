import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// Import pages
import HomePage from './pages/HomePage'

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/studybuddy-1">
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box component="header" sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
            <Container maxWidth="lg">
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                StudyBuddy
              </Typography>
              <Typography variant="subtitle1">
                AI-powered learning assistant for students
              </Typography>
            </Container>
          </Box>
          
          {/* Main Content */}
          <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
            <Container maxWidth="lg">
              <Routes>
                <Route path="/" element={<HomePage />} />
              </Routes>
            </Container>
          </Box>
          
          {/* Footer */}
          <Box component="footer" sx={{ p: 2, backgroundColor: 'primary.main', color: 'white', mt: 'auto' }}>
            <Container maxWidth="lg">
              <Typography variant="body2" align="center">
                © {new Date().getFullYear()} StudyBuddy - Powered by Gemini, Groq AI, and Tavily Search
              </Typography>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  )
}

export default App
