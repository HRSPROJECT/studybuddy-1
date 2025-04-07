import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// Import pages
import HomePage from './pages/HomePage'

// Create theme with light and dark mode support
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      dark: '#115293',
      light: '#4791db',
      contrastText: '#fff',
    },
    secondary: {
      main: '#dc004e',
      dark: '#9a0036',
      light: '#e33371',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      '@media (min-width:600px)': {
        fontSize: '3rem',
      },
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.08), 0px 1px 1px 0px rgba(0,0,0,0.07), 0px 1px 3px 0px rgba(0,0,0,0.06)'
        },
        elevation3: {
          boxShadow: '0px 3px 3px -2px rgba(0,0,0,0.08), 0px 3px 4px 0px rgba(0,0,0,0.07), 0px 1px 8px 0px rgba(0,0,0,0.06)'
        }
      }
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

function App() {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/studybuddy-1">
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.default' 
        }}>
          {/* Header */}
          <Box 
            component="header" 
            sx={{ 
              p: isMobile ? 2 : 3, 
              backgroundColor: 'primary.main', 
              color: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
            }}
          >
            <Container maxWidth="lg">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    component="h1" 
                    sx={{ 
                      fontWeight: 'bold',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.15)',
                      letterSpacing: '0.5px'
                    }}
                  >
                    StudyBuddy
                  </Typography>
                  <Typography 
                    variant={isMobile ? "body2" : "subtitle1"}
                    sx={{
                      opacity: 0.9,
                      mt: 0.5
                    }}
                  >
                    AI-powered learning assistant
                  </Typography>
                </Box>
                {/* We can add a logo or user profile icon here if needed */}
              </Box>
            </Container>
          </Box>
          
          {/* Main Content */}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              py: isMobile ? 2 : 4,
              px: isMobile ? 1 : 2,
            }}
          >
            <Container maxWidth="lg">
              <Routes>
                <Route path="/" element={<HomePage />} />
              </Routes>
            </Container>
          </Box>
          
          {/* Footer */}
          <Box 
            component="footer" 
            sx={{ 
              p: isMobile ? 2 : 3, 
              backgroundColor: '#f5f5f5', 
              color: 'text.secondary', 
              mt: 'auto',
              borderTop: '1px solid #e0e0e0'
            }}
          >
            <Container maxWidth="lg">
              <Typography 
                variant="body2" 
                align="center"
                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
              >
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
