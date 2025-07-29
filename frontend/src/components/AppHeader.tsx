import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showControls?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  children?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  showLogo = true, 
  showControls = true,
  showBackButton = false,
  onBackClick,
  children 
}) => {
  const { mode } = useTheme();

  return (
    <Box sx={{ 
      bgcolor: 'background.paper', 
      borderBottom: '1px solid', 
      borderColor: 'divider',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {showBackButton && (
              <IconButton onClick={onBackClick} sx={{ mr: 1 }}>
                <ArrowBack sx={{ color: 'text.primary' }} />
              </IconButton>
            )}
            
            {showLogo && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img 
                  src={mode === 'dark' ? '/logoDark.png' : '/logoLight.png'} 
                  alt="MesNotes Logo" 
                  style={{ 
                    height: '32px', 
                    width: 'auto',
                    maxWidth: '120px'
                  }} 
                />
              </Box>
            )}
            
            {title && (
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            )}
            
            {children}
          </Box>
        
        {showControls && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThemeToggle />
            <LanguageSelector />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AppHeader; 