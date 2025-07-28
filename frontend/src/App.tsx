import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n'; // Importar configuração do i18n

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotePage from './pages/NotePage';
import ProfilePage from './pages/ProfilePage';

// Componentes
import LoadingSpinner from './components/LoadingSpinner';
import NotificationToast from './components/NotificationToast';

// Componente interno para usar o contexto de auth
const AppContent: React.FC = () => {
  const { loading } = useAuth();

  return (
    <Router>
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/note/:id" element={<NotePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        {loading === 'loading' && <LoadingSpinner />}
        <NotificationToast />
      </Box>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;