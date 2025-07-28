import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ThemeMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#667eea',
        light: '#8fa4ef',
        dark: '#4c63d2',
      },
      secondary: {
        main: '#764ba2',
        light: '#9a7bb8',
        dark: '#5a3d7a',
      },
      background: {
        default: mode === 'light' ? '#f8f9fa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#2c3e50' : '#ffffff',
        secondary: mode === 'light' ? '#7f8c8d' : '#b0b0b0',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 2px 8px rgba(0,0,0,0.1)' 
              : '0 2px 8px rgba(0,0,0,0.3)',
            backgroundColor: mode === 'light' ? '#ffffff' : '#2d2d2d',
            border: mode === 'light' ? '1px solid #e0e0e0' : '1px solid #404040',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: mode === 'light' ? '#ffffff' : '#2d2d2d',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            color: mode === 'light' ? '#2c3e50' : '#ffffff',
            boxShadow: mode === 'light' 
              ? '0 1px 3px rgba(0,0,0,0.1)' 
              : '0 1px 3px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 