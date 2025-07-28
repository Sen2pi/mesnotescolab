import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Save,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  Person,
  Email,
  Lock
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toastService } from '../components/NotificationToast';
import LoadingSpinner from '../components/LoadingSpinner';
import { Grid } from '@mui/material';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, loading } = useAuth();

  const [profileData, setProfileData] = useState({
    nom: user?.nom || '',
    avatar: user?.avatar || ''
  });

  const [passwordData, setPasswordData] = useState({
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmNouveauMotDePasse: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    ancien: false,
    nouveau: false,
    confirm: false
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ [key: string]: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!profileData.nom.trim()) {
      errors.nom = 'Le nom est requis';
    } else if (profileData.nom.trim().length < 2) {
      errors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!passwordData.ancienMotDePasse) {
      errors.ancienMotDePasse = 'L\'ancien mot de passe est requis';
    }

    if (!passwordData.nouveauMotDePasse) {
      errors.nouveauMotDePasse = 'Le nouveau mot de passe est requis';
    } else if (passwordData.nouveauMotDePasse.length < 6) {
      errors.nouveauMotDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!passwordData.confirmNouveauMotDePasse) {
      errors.confirmNouveauMotDePasse = 'La confirmation est requise';
    } else if (passwordData.nouveauMotDePasse !== passwordData.confirmNouveauMotDePasse) {
      errors.confirmNouveauMotDePasse = 'Les mots de passe ne correspondent pas';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfile()) return;

    try {
      await updateProfile({
        nom: profileData.nom.trim(),
        avatar: profileData.avatar
      });
      
      setEditingProfile(false);
      toastService.success('Profil mis à jour avec succès', 'Succès');
    } catch (error: any) {
      toastService.error(error.message || 'Erreur lors de la mise à jour', 'Erreur');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;

    try {
      await changePassword(passwordData.ancienMotDePasse, passwordData.nouveauMotDePasse);
      
      setPasswordData({
        ancienMotDePasse: '',
        nouveauMotDePasse: '',
        confirmNouveauMotDePasse: ''
      });
      setChangingPassword(false);
      toastService.success('Mot de passe changé avec succès', 'Succès');
    } catch (error: any) {
      toastService.error(error.message || 'Erreur lors du changement de mot de passe', 'Erreur');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dans un vrai projet, on uploaderait le fichier
      // Ici on simule juste avec un placeholder
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileData(prev => ({ ...prev, avatar: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading === 'loading') {
    return <LoadingSpinner message="Chargement du profil..." />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Mon Profil
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Informations du profil */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={2}
              sx={{
                p: 4,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                  Informations personnelles
                </Typography>
                <IconButton
                  onClick={() => setEditingProfile(!editingProfile)}
                  color={editingProfile ? 'primary' : 'default'}
                >
                  <Edit />
                </IconButton>
              </Box>

              <Box component="form" onSubmit={handleUpdateProfile}>
                {/* Avatar */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={profileData.avatar}
                      sx={{
                        width: 120,
                        height: 120,
                        fontSize: '3rem',
                        bgcolor: 'primary.main',
                        border: '4px solid white',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    >
                      {profileData.nom.charAt(0).toUpperCase()}
                    </Avatar>
                    
                    {editingProfile && (
                      <IconButton
                        component="label"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }}
                      >
                        <PhotoCamera />
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {/* Champs du profil */}
                <TextField
                  fullWidth
                  name="nom"
                  label="Nom complet"
                  value={profileData.nom}
                  onChange={handleProfileChange}
                  disabled={!editingProfile}
                  error={!!profileErrors.nom}
                  helperText={profileErrors.nom}
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
                  label="Adresse email"
                  value={user?.email || ''}
                  disabled
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                {editingProfile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileData({
                            nom: user?.nom || '',
                            avatar: user?.avatar || ''
                          });
                          setProfileErrors({});
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save />}
                        disabled={loading !== 'idle'}
                      >
                        Sauvegarder
                      </Button>
                    </Box>
                  </motion.div>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Changement de mot de passe */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={2}
              sx={{
                p: 4,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                  Sécurité
                </Typography>
                <IconButton
                  onClick={() => setChangingPassword(!changingPassword)}
                  color={changingPassword ? 'primary' : 'default'}
                >
                  <Lock />
                </IconButton>
              </Box>

              {changingPassword ? (
                <Box component="form" onSubmit={handleChangePassword}>
                  <TextField
                    fullWidth
                    name="ancienMotDePasse"
                    label="Ancien mot de passe"
                    type={showPasswords.ancien ? 'text' : 'password'}
                    value={passwordData.ancienMotDePasse}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.ancienMotDePasse}
                    helperText={passwordErrors.ancienMotDePasse}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPasswords(prev => ({ ...prev, ancien: !prev.ancien }))}
                            edge="end"
                          >
                            {showPasswords.ancien ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    name="nouveauMotDePasse"
                    label="Nouveau mot de passe"
                    type={showPasswords.nouveau ? 'text' : 'password'}
                    value={passwordData.nouveauMotDePasse}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.nouveauMotDePasse}
                    helperText={passwordErrors.nouveauMotDePasse}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPasswords(prev => ({ ...prev, nouveau: !prev.nouveau }))}
                            edge="end"
                          >
                            {showPasswords.nouveau ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    name="confirmNouveauMotDePasse"
                    label="Confirmer le nouveau mot de passe"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmNouveauMotDePasse}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.confirmNouveauMotDePasse}
                    helperText={passwordErrors.confirmNouveauMotDePasse}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            edge="end"
                          >
                            {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswordData({
                          ancienMotDePasse: '',
                          nouveauMotDePasse: '',
                          confirmNouveauMotDePasse: ''
                        });
                        setPasswordErrors({});
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="warning"
                      disabled={loading !== 'idle'}
                    >
                      Changer le mot de passe
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Votre mot de passe est sécurisé. Cliquez sur l'icône pour le modifier.
                  </Alert>
                  
                  <Typography variant="body2" color="text.secondary">
                    Dernière modification : {formatDate(user?.updatedAt || '')}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Informations du compte */}
          <Grid size={12}>
            <Paper
              elevation={2}
              sx={{
                p: 4,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
                Informations du compte
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Membre depuis
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {formatDate(user?.createdAt || '')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Dernière connexion
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {formatDate(user?.derniereConnexion || '')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default ProfilePage;