import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import { toastService } from '../components/NotificationToast';
import LanguageSelector from '../components/LanguageSelector';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const { mode } = useTheme();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError(t('validation.required'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.login({
        email: formData.email,
        motDePasse: formData.password
      });
      
      if (response.success && response.data) {
        console.log('✅ LoginPage - Login bem-sucedido, chamando AuthContext.login');
        await login(response.data.user.email, formData.password);
        console.log('✅ LoginPage - AuthContext.login concluído, redirecionando...');
        toastService.success(t('auth.login.loginSuccess'), t('common.success'));
        navigate('/dashboard');
        console.log('✅ LoginPage - Redirecionamento executado');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Tratamento específico para rate limiting
      if (error.response?.status === 429) {
        setError(t('auth.login.tooManyRequests'));
      } else {
        setError(error.response?.data?.message || t('auth.login.loginError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      {/* Seletor de idioma no topo */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <LanguageSelector />
      </Box>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {/* Logo da aplicação */}
              <Box sx={{ mb: 3 }}>
                <img 
                  src={mode === 'dark' ? '/logoDark.png' : '/logoLight.png'} 
                  alt="MesNotes Logo" 
                  style={{ 
                    height: '80px', 
                    width: 'auto',
                    maxWidth: '200px'
                  }} 
                />
              </Box>
              
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                {t('auth.login.title')}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {t('auth.login.subtitle')}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label={t('auth.login.email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label={t('auth.login.password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #674190 100%)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('auth.login.loginButton')
                )}
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  {t('auth.login.noAccount')}{' '}
                  <Link
                    to="/register"
                    style={{
                      color: '#667eea',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {t('auth.login.createAccount')}
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default LoginPage;