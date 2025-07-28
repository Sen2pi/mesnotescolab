import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
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
  Button,
  Grid,
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
  Dashboard as DashboardIcon,
  Folder,
  Workspaces,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Note, NotesResponse, UserStats } from '../types';
import { apiService } from '../services/api';
import { toastService } from '../components/NotificationToast';
import LoadingSpinner from '../components/LoadingSpinner';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import NotificationsPanel from '../components/NotificationsPanel';
import WorkspaceManager from '../components/WorkspaceManager';
import WorkspaceSelector from '../components/WorkspaceSelector';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { mode } = useTheme();

  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mine' | 'shared' | 'public'>('all');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [noteMenuAnchor, setNoteMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);
  const [workspaceSelectorOpen, setWorkspaceSelectorOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Verificar autenticação
  useEffect(() => {
    console.log('🔍 DashboardPage - Verificando autenticação:', { isAuthenticated, user: user?.nom });
    if (!isAuthenticated || !user) {
      console.log('❌ DashboardPage - Usuário não autenticado, redirecionando para login');
      navigate('/login');
      return;
    }
    
    console.log('✅ DashboardPage - Usuário autenticado, carregando dados');
    loadDashboardData();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
      loadUnreadNotificationsCount();
      loadWorkspaces();
    }
  }, [searchTerm, selectedFilter, selectedWorkspace]);

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
        
        // Aplicar filtros
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
        
        // Filtrar por workspace
        if (selectedWorkspace !== 'all') {
          filteredNotes = filteredNotes.filter(note => 
            note.workspace?._id === selectedWorkspace
          );
        }
        
        setNotes(filteredNotes);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error: any) {
      toastService.error(t('errors.unknown'), t('common.error'));
      console.error('Erro carregamento dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    setWorkspaceSelectorOpen(true);
  };

  const handleWorkspaceSelected = (workspace: any) => {
    navigate(`/note/new?workspace=${workspace._id}`);
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const handleNoteMenuClick = (event: React.MouseEvent<HTMLElement>, noteId: string) => {
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
      const response = await apiService.archiveNote(selectedNoteId);
      if (response.success) {
        toastService.success(t('notes.archiveSuccess'), t('common.success'));
        loadDashboardData();
      }
    } catch (error: any) {
      toastService.error(t('errors.unknown'), t('common.error'));
    } finally {
      handleNoteMenuClose();
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;
    
    try {
      const response = await apiService.deleteNote(selectedNoteId);
      if (response.success) {
        toastService.success(t('notes.deleteSuccess'), t('common.success'));
        loadDashboardData();
      }
    } catch (error: any) {
      toastService.error(t('errors.unknown'), t('common.error'));
    } finally {
      handleNoteMenuClose();
    }
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

  const loadUnreadNotificationsCount = async () => {
    try {
      const response = await apiService.getUnreadNotificationsCount();
      if (response.success && response.data) {
        setUnreadNotificationsCount(response.data.count);
      }
    } catch (error) {
      console.error('Erro ao carregar contador de notificações:', error);
    }
  };

  const handleNotificationsClick = () => {
    setNotificationsOpen(true);
  };

  const handleWorkspaceManagerClick = () => {
    setWorkspaceManagerOpen(true);
  };

  const loadWorkspaces = async () => {
    try {
      const response = await apiService.getWorkspaces();
      if (response.success && response.data) {
        setWorkspaces(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
    }
  };

  const getCollaboratorCount = (note: Note) => {
    return note.collaborateurs.length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img
              src={mode === 'light' ? '/logoDark.png' : '/logoLight.png'}
              alt="Logo"
              style={{ height: 32, marginRight: 16 }}
            />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              {t('dashboard.title')}
            </Typography>
          </Box>

          {/* Barra de pesquisa */}
          <TextField
            size="small"
            placeholder={t('dashboard.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 2, minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {/* Botão de Workspaces */}
          <IconButton 
            color="inherit" 
            sx={{ mr: 1 }}
            onClick={handleWorkspaceManagerClick}
            title="Gerenciar Workspaces"
          >
            <Workspaces />
          </IconButton>

          {/* Seletor de idioma */}
          <LanguageSelector />

          {/* Alternador de tema */}
          <ThemeToggle />

          {/* Notificações */}
          <IconButton 
            color="inherit" 
            sx={{ mr: 1 }}
            onClick={handleNotificationsClick}
          >
            <Badge badgeContent={unreadNotificationsCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Menu do usuário */}
          <IconButton onClick={handleUserMenuClick} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.nom?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: { minWidth: 200, mt: 1 }
            }}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              <AccountCircle sx={{ mr: 2 }} />
              {t('common.profile')}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 2 }} />
              {t('common.logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Conteúdo principal */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Estatísticas */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255, 255, 255, 0.1)',
                      zIndex: 1,
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {t('dashboard.stats.totalNotes')}
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
                      {stats.totalNotes}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255, 255, 255, 0.1)',
                      zIndex: 1,
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {t('dashboard.stats.notesCreated')}
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
                      {stats.notesCreated}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255, 255, 255, 0.1)',
                      zIndex: 1,
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {t('dashboard.stats.notesCollaborated')}
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
                      {stats.notesCollaborated}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255, 255, 255, 0.1)',
                      zIndex: 1,
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {t('dashboard.stats.publicNotes')}
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
                      {stats.publicNotes}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}

        {/* Filtros */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {(['all', 'mine', 'shared', 'public'] as const).map((filter) => (
              <Grid key={filter}>
                <Chip
                  label={t(`dashboard.filters.${filter}`)}
                  onClick={() => setSelectedFilter(filter)}
                  color={selectedFilter === filter ? 'primary' : 'default'}
                  variant={selectedFilter === filter ? 'filled' : 'outlined'}
                />
              </Grid>
            ))}
          </Grid>
          
          {/* Filtro de Workspace */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Workspace:
            </Typography>
            <Grid container spacing={1}>
              <Grid>
                <Chip
                  label="Todos os Workspaces"
                  onClick={() => setSelectedWorkspace('all')}
                  color={selectedWorkspace === 'all' ? 'primary' : 'default'}
                  variant={selectedWorkspace === 'all' ? 'filled' : 'outlined'}
                />
              </Grid>
              {workspaces.map((workspace) => (
                <Grid key={workspace._id}>
                  <Chip
                    label={workspace.nom}
                    onClick={() => setSelectedWorkspace(workspace._id)}
                    color={selectedWorkspace === workspace._id ? 'primary' : 'default'}
                    variant={selectedWorkspace === workspace._id ? 'filled' : 'outlined'}
                    sx={{
                      borderLeft: `4px solid ${workspace.couleur}`,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Lista de notas */}
        <Grid container spacing={3}>
          <AnimatePresence>
            {notes.length === 0 ? (
              <Grid size={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      {t('dashboard.noNotes')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('dashboard.noNotesMessage')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              notes.map((note) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={note._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        },
                      }}
                      onClick={() => handleNoteClick(note._id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, flexGrow: 1 }}>
                            {note.titre}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNoteMenuClick(e, note._id);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>

                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {note.contenu}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(note.derniereActivite)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {note.workspace && (
                              <Chip
                                size="small"
                                label={note.workspace.nom}
                                variant="outlined"
                                sx={{
                                  borderLeft: `3px solid ${note.workspace.couleur}`,
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                            {getCollaboratorCount(note) > 0 && (
                              <Chip
                                size="small"
                                label={`${getCollaboratorCount(note)} ${t('notes.collaborators')}`}
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))
            )}
          </AnimatePresence>
        </Grid>
      </Container>

      {/* Botão flutuante para criar nota */}
      <Fab
        color="primary"
        aria-label={t('dashboard.createNote')}
        onClick={handleCreateNote}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <Add />
      </Fab>

      {/* Menu de ações da nota */}
      <Menu
        anchorEl={noteMenuAnchor}
        open={Boolean(noteMenuAnchor)}
        onClose={handleNoteMenuClose}
        PaperProps={{
          sx: { minWidth: 150 }
        }}
      >
        <MenuItem onClick={() => handleNoteClick(selectedNoteId!)}>
          <Edit sx={{ mr: 2 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleArchiveNote}>
          <Archive sx={{ mr: 2 }} />
          {t('notes.archive')}
        </MenuItem>
        <MenuItem onClick={handleDeleteNote} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 2 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>

      {/* Painel de Notificações */}
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

              {/* Gerenciador de Workspaces */}
        <WorkspaceManager
          open={workspaceManagerOpen}
          onClose={() => setWorkspaceManagerOpen(false)}
          onWorkspaceCreated={(workspace) => {
            toastService.success(`Workspace "${workspace.nom}" criado com sucesso!`);
          }}
        />

        {/* Seletor de Workspace */}
        <WorkspaceSelector
          open={workspaceSelectorOpen}
          onClose={() => setWorkspaceSelectorOpen(false)}
          onWorkspaceSelected={handleWorkspaceSelected}
        />
      </Box>
    );
  };

export default DashboardPage;