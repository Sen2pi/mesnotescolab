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
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import { toastService } from '../components/NotificationToast';
import LanguageSelector from '../components/LanguageSelector';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const { mode } = useTheme();
  
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');

    // Calcular força da senha
    if (name === 'password') {
      let strength = 0;
      if (value.length >= 8) strength += 25;
      if (/[a-z]/.test(value)) strength += 25;
      if (/[A-Z]/.test(value)) strength += 25;
      if (/[0-9]/.test(value)) strength += 25;
      setPasswordStrength(strength);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'error';
    if (passwordStrength <= 50) return 'warning';
    if (passwordStrength <= 75) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return t('auth.register.weak');
    if (passwordStrength <= 50) return t('auth.register.medium');
    if (passwordStrength <= 75) return t('auth.register.strong');
    return t('auth.register.excellent');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('validation.required'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('validation.passwordMatch'));
      return;
    }

    if (passwordStrength < 50) {
      setError(t('validation.passwordStrength'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.register({
        nom: formData.nom,
        email: formData.email,
        motDePasse: formData.password,
        confirmMotDePasse: formData.password
      });
      
      if (response.success && response.data) {
        await login(response.data.user.email, response.data.token);
        toastService.success(t('auth.register.registerSuccess'), t('common.success'));
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      // Tratamento específico para erro 409 (email já existe)
      if (error.response?.status === 409) {
        setError(t('auth.register.emailExists'));
      } else if (error.response?.status === 429) {
        setError(t('auth.register.tooManyRequests'));
      } else {
        setError(error.response?.data?.message || t('auth.register.registerError'));
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
                {t('auth.register.title')}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {t('auth.register.subtitle')}
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
                label={t('auth.register.name')}
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                margin="normal"
                required
                autoComplete="name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

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
                autoComplete="new-password"
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
                sx={{ mb: 1 }}
              />

              {formData.password && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      {t('auth.register.passwordStrength')}
                    </Typography>
                    <Typography variant="caption" color={`${getPasswordStrengthColor()}.main`}>
                      {getPasswordStrengthText()}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength}
                    color={getPasswordStrengthColor() as any}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              )}

              <TextField
                fullWidth
                label={t('auth.register.confirmPassword')}
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                required
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                  t('auth.register.registerButton')
                )}
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  {t('auth.register.hasAccount')}{' '}
                  <Link
                    to="/login"
                    style={{
                      color: '#667eea',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {t('auth.register.signIn')}
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

export default RegisterPage;