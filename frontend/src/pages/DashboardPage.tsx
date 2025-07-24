import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Fab,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  AppBar,
  Toolbar,
  Avatar,
  Badge,
  Button
} from '@mui/material';
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Archive,
  Delete,
  Share,
  Notifications,
  AccountCircle,
  Logout,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Note, NotesResponse, UserStats } from '../types';
import { apiService } from '../services/api';
import { toastService } from '../components/NotificationToast';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mine' | 'shared' | 'public'>('all');
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [noteMenuAnchor, setNoteMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [searchTerm, selectedFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [notesResponse, statsResponse] = await Promise.all([
        apiService.getNotes({ 
          search: searchTerm || undefined,
          limit: 20 
        }),
        apiService.getUserStats()
      ]);

      if (notesResponse.success && notesResponse.data) {
        let filteredNotes = notesResponse.data.notes;
        
        // Appliquer les filtres
        switch (selectedFilter) {
          case 'mine':
            filteredNotes = filteredNotes.filter(note => note.auteur._id === user?._id);
            break;
          case 'shared':
            filteredNotes = filteredNotes.filter(note => 
              note.collaborateurs.some(collab => collab.userId._id === user?._id)
            );
            break;
          case 'public':
            filteredNotes = filteredNotes.filter(note => note.isPublic);
            break;
        }
        
        setNotes(filteredNotes);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error: any) {
      toastService.error('Erreur lors du chargement des données', 'Erreur');
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    navigate('/note/new');
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const handleNoteMenuClick = (event: React.MouseEvent<HTMLElement>, noteId: string) => {
    event.stopPropagation();
    setNoteMenuAnchor(event.currentTarget);
    setSelectedNoteId(noteId);
  };

  const handleNoteMenuClose = () => {
    setNoteMenuAnchor(null);
    setSelectedNoteId(null);
  };

  const handleArchiveNote = async () => {
    if (!selectedNoteId) return;
    
    try {
      await apiService.archiveNote(selectedNoteId);
      toastService.success('Note archivée', 'Succès');
      loadDashboardData();
    } catch (error: any) {
      toastService.error('Erreur lors de l\'archivage', 'Erreur');
    }
    handleNoteMenuClose();
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      try {
        await apiService.deleteNote(selectedNoteId);
        toastService.success('Note supprimée', 'Succès');
        loadDashboardData();
      } catch (error: any) {
        toastService.error('Erreur lors de la suppression', 'Erreur');
      }
    }
    handleNoteMenuClose();
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCollaboratorCount = (note: Note) => {
    return note.collaborateurs.length;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return <LoadingSpinner message="Chargement du tableau de bord..." />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <DashboardIcon sx={{ color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 600 }}>
            Mes Notes Colab
          </Typography>
          
          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <Notifications sx={{ color: 'text.secondary' }} />
            </Badge>
          </IconButton>
          
          <IconButton onClick={handleUserMenuClick} sx={{ ml: 1 }}>
            <Avatar 
              src={user?.avatar} 
              sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
            >
              {user?.nom.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.totalNotes}
                    </Typography>
                    <Typography variant="body2">
                      Notes totales
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.notesCreated}
                    </Typography>
                    <Typography variant="body2">
                      Notes créées
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.notesCollaborated}
                    </Typography>
                    <Typography variant="body2">
                      Collaborations
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card sx={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.publicNotes}
                    </Typography>
                    <Typography variant="body2">
                      Notes publiques
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}

        {/* Filtres et recherche */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Rechercher dans vos notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ bgcolor: 'white', borderRadius: 2 }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'Toutes' },
                  { key: 'mine', label: 'Mes notes' },
                  { key: 'shared', label: 'Partagées' },
                  { key: 'public', label: 'Publiques' }
                ].map((filter) => (
                  <Chip
                    key={filter.key}
                    label={filter.label}
                    onClick={() => setSelectedFilter(filter.key as any)}
                    color={selectedFilter === filter.key ? 'primary' : 'default'}
                    variant={selectedFilter === filter.key ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Notes Grid */}
        <Grid container spacing={3}>
          <AnimatePresence>
            {notes.map((note, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={note._id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderLeft: `4px solid ${note.couleur}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      }
                    }}
                    onClick={() => handleNoteClick(note._id)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
                          {note.titre}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleNoteMenuClick(e, note._id)}
                          sx={{ ml: 1 }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                      
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {note.contenu.replace(/[#*`]/g, '').substring(0, 150)}...
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {note.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                        {note.tags.length > 3 && (
                          <Chip
                            label={`+${note.tags.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(note.updatedAt)}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {note.isPublic && (
                            <Chip label="Public" size="small" color="info" variant="outlined" />
                          )}
                          {getCollaboratorCount(note) > 0 && (
                            <Chip
                              label={`${getCollaboratorCount(note)} collab.`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>

        {notes.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {searchTerm ? 'Aucune note trouvée' : 'Aucune note pour le moment'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm
                ? 'Essayez de modifier votre recherche ou vos filtres'
                : 'Créez votre première note pour commencer'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateNote}
              size="large"
            >
              Créer une note
            </Button>
          </Box>
        )}
      </Container>

      {/* FAB pour créer une note */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      >
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleCreateNote}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #674190 100%)',
              transform: 'scale(1.1)',
            },
          }}
        >
          <Add />
        </Fab>
      </motion.div>

      {/* Menu utilisateur */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
          <AccountCircle sx={{ mr: 2 }} />
          Profil
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 2 }} />
          Déconnexion
        </MenuItem>
      </Menu>

      {/* Menu des notes */}
      <Menu
        anchorEl={noteMenuAnchor}
        open={Boolean(noteMenuAnchor)}
        onClose={handleNoteMenuClose}
      >
        <MenuItem onClick={() => { handleNoteMenuClose(); selectedNoteId && navigate(`/note/${selectedNoteId}`); }}>
          <Edit sx={{ mr: 2 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={() => { handleNoteMenuClose(); /* Implement share */ }}>
          <Share sx={{ mr: 2 }} />
          Partager
        </MenuItem>
        <MenuItem onClick={handleArchiveNote}>
          <Archive sx={{ mr: 2 }} />
          Archiver
        </MenuItem>
        <MenuItem onClick={handleDeleteNote} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 2 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardPage;