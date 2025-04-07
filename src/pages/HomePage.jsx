import { useState } from 'react';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';

// Import our tab components
import AskTab from '../components/AskTab';
import ExplainTab from '../components/ExplainTab';

// TabPanel component to handle tab content visibility
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`studybuddy-tabpanel-${index}`}
      aria-labelledby={`studybuddy-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Function to generate accessibility props for tabs
function a11yProps(index) {
  return {
    id: `studybuddy-tab-${index}`,
    'aria-controls': `studybuddy-tabpanel-${index}`,
  };
}

export default function HomePage() {
  const [tabValue, setTabValue] = useState(0);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Tab navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="StudyBuddy features" 
            centered
            sx={{
              '& .MuiTab-root': { 
                fontWeight: 'bold',
                fontSize: '1.1rem',
                py: 2
              }
            }}
          >
            <Tab label="Ask" {...a11yProps(0)} />
            <Tab label="Explain" {...a11yProps(1)} />
          </Tabs>
        </Box>

        {/* Tab content */}
        <TabPanel value={tabValue} index={0}>
          <AskTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ExplainTab />
        </TabPanel>
      </Paper>
    </Box>
  );
}