import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <Tooltip title={mode === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        sx={{
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'rotate(180deg)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {mode === 'light' ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle; 