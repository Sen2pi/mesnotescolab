import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  PersonAddOutlined
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toastService } from '../components/NotificationToast';
import LoadingSpinner from '../components/LoadingSpinner';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Calcul de la force du mot de passe
    if (name === 'motDePasse') {
      calculatePasswordStrength(value);
    }
    
    // Effacer les erreurs lors de la saisie
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) {
      clearError();
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    setPasswordStrength(Math.min(strength, 100));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return 'error';
    if (passwordStrength < 60) return 'warning';
    if (passwordStrength < 80) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return 'Faible';
    if (passwordStrength < 60) return 'Moyen';
    if (passwordStrength < 80) return 'Bon';
    return 'Excellent';
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.nom.trim()) {
      errors.nom = 'Le nom est requis';
    } else if (formData.nom.trim().length < 2) {
      errors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.motDePasse) {
      errors.motDePasse = 'Le mot de passe est requis';
    } else if (formData.motDePasse.length < 6) {
      errors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.confirmMotDePasse) {
      errors.confirmMotDePasse = 'La confirmation du mot de passe est requise';
    } else if (formData.motDePasse !== formData.confirmMotDePasse) {
      errors.confirmMotDePasse = 'Les mots de passe ne correspondent pas';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await register(formData.nom.trim(), formData.email, formData.motDePasse);
      toastService.success('Compte créé avec succès !', 'Bienvenue');
      navigate('/dashboard');
    } catch (err: any) {
      toastService.error(err.message || 'Erreur lors de la création du compte', 'Échec de l\'inscription');
    }
  };

  if (loading === 'loading') {
    return <LoadingSpinner message="Création du compte..." />;
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%' }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Logo et titre */}
          <Box textAlign="center" mb={4}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="Mes Notes Colab"
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </motion.div>
            
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Créer un compte
            </Typography>
            
            <Typography variant="body1" color="text.secondary">
              Rejoignez la communauté des notes collaboratives
            </Typography>
          </Box>

          {/* Formulaire d'inscription */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              </motion.div>
            )}

            <TextField
              fullWidth
              name="nom"
              label="Nom complet"
              value={formData.nom}
              onChange={handleChange}
              error={!!fieldErrors.nom}
              helperText={fieldErrors.nom}
              margin="normal"
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
              name="email"
              label="Adresse email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              margin="normal"
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
              name="motDePasse"
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={formData.motDePasse}
              onChange={handleChange}
              error={!!fieldErrors.motDePasse}
              helperText={fieldErrors.motDePasse}
              margin="normal"
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

            {/* Indicateur de force du mot de passe */}
            {formData.motDePasse && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Force du mot de passe
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
              </motion.div>
            )}

            <TextField
              fullWidth
              name="confirmMotDePasse"
              label="Confirmer le mot de passe"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmMotDePasse}
              onChange={handleChange}
              error={!!fieldErrors.confirmMotDePasse}
              helperText={fieldErrors.confirmMotDePasse}
              margin="normal"
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

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PersonAddOutlined />}
                disabled={loading === 'loading' as typeof loading}
                sx={{
                  py: 1.5,
                  mb: 2,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #674190 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                  },
                }}
              >
                Créer mon compte
              </Button>
            </motion.div>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ou
              </Typography>
            </Divider>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Déjà un compte ?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Se connecter
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default RegisterPage;