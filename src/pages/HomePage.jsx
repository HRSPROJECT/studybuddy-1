import { useState, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Container, 
  Typography, 
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme,
  Button,
  Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import ScienceIcon from '@mui/icons-material/Science';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import NightlightIcon from '@mui/icons-material/Nightlight';
import LightModeIcon from '@mui/icons-material/LightMode';
import AskTab from '../components/AskTab';
import ExplainTab from '../components/ExplainTab';
import { preloadMathJax } from '../utils/mathJaxRenderer';

export default function HomePage() {
  const [tabValue, setTabValue] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLaptop = useMediaQuery(theme.breakpoints.up('md'));
  
  // Preload MathJax for faster math rendering
  useEffect(() => {
    preloadMathJax();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, you would implement a theme context/provider
  };

  // Menu items for the drawer
  const menuItems = [
    { text: 'Ask a Question', icon: <QuizIcon />, onClick: () => { setTabValue(0); setMenuOpen(false); } },
    { text: 'Explain a Concept', icon: <ScienceIcon />, onClick: () => { setTabValue(1); setMenuOpen(false); } },
    { text: 'Saved Content', icon: <BookmarkIcon />, onClick: () => {} },
    { text: 'History', icon: <HistoryIcon />, onClick: () => {} },
    { text: 'Settings', icon: <SettingsIcon />, onClick: () => {} },
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      bgcolor: darkMode ? '#121212' : '#f5f5f7'
    }}>
      {/* App Bar */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          bgcolor: darkMode ? '#1e1e1e' : 'white',
          color: darkMode ? 'white' : 'primary.main',
          borderBottom: '1px solid',
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleMenu}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flexGrow: 1
          }}>
            <SchoolIcon sx={{ mr: 1 }} />
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component="div"
              sx={{ 
                fontWeight: 700,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              StudyBuddy
            </Typography>
          </Box>
          
          <IconButton 
            color="inherit" 
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <LightModeIcon /> : <NightlightIcon />}
          </IconButton>
          
          {isLaptop && (
            <Button 
              variant="contained"
              color="secondary"
              sx={{ 
                ml: 2,
                fontWeight: 600,
                boxShadow: 2
              }}
            >
              Upgrade
            </Button>
          )}

          <Avatar
            sx={{ 
              width: 36, 
              height: 36,
              ml: 2,
              bgcolor: 'secondary.main',
              fontWeight: 'bold'
            }}
            alt="User"
          >
            U
          </Avatar>
        </Toolbar>
      </AppBar>
      
      {/* Side Drawer Menu */}
      <Drawer
        anchor="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: darkMode ? '#1e1e1e' : 'white',
            color: darkMode ? 'white' : 'inherit',
          }
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
          <SchoolIcon sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            StudyBuddy
          </Typography>
        </Box>
        
        <Divider sx={{ 
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }} />
        
        <List>
          {menuItems.map((item, index) => (
            <ListItem 
              button 
              key={index}
              onClick={item.onClick}
              selected={
                (index === 0 && tabValue === 0) || 
                (index === 1 && tabValue === 1)
              }
              sx={{
                py: 1.5,
                pl: 3,
                '&.Mui-selected': {
                  bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(25, 118, 210, 0.1)',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main'
                  }
                },
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: 500
                }}
              />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ 
          p: 2, 
          textAlign: 'center',
          mt: 'auto'
        }}>
          <Typography variant="body2" color="text.secondary">
            &copy; 2025 StudyBuddy AI
          </Typography>
        </Box>
      </Drawer>
      
      {/* Main Content */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 4 },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}
      >
        {/* Tabs for navigation between Ask and Explain */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: darkMode ? '#1e1e1e' : 'white',
            border: '1px solid',
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            aria-label="StudyBuddy Tabs"
            sx={{
              '& .MuiTab-root': {
                py: 2,
                fontSize: '1rem',
                fontWeight: 600
              }
            }}
          >
            <Tab 
              icon={<QuizIcon sx={{ mr: 1 }} />} 
              iconPosition="start"
              label="Ask a Question" 
              id="studybuddy-tab-0"
              aria-controls="studybuddy-tabpanel-0"
            />
            <Tab 
              icon={<ScienceIcon sx={{ mr: 1 }} />}
              iconPosition="start" 
              label="Explain a Concept" 
              id="studybuddy-tab-1"
              aria-controls="studybuddy-tabpanel-1"
            />
          </Tabs>
        </Paper>

        {/* Tab content */}
        <div
          role="tabpanel"
          hidden={tabValue !== 0}
          id="studybuddy-tabpanel-0"
          aria-labelledby="studybuddy-tab-0"
        >
          {tabValue === 0 && <AskTab />}
        </div>
        <div
          role="tabpanel"
          hidden={tabValue !== 1}
          id="studybuddy-tabpanel-1"
          aria-labelledby="studybuddy-tab-1"
        >
          {tabValue === 1 && <ExplainTab />}
        </div>
      </Container>
    </Box>
  );
}