import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Share,
  MoreVert,
  People,
  PersonAdd,
  Visibility,
  Edit as EditIcon,
  Public,
  Lock
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAuth } from '../contexts/AuthContext';
import { Note, SocketUser } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import { toastService } from '../components/NotificationToast';
import LoadingSpinner from '../components/LoadingSpinner';

const NotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<SocketUser[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Charger la note
  useEffect(() => {
    if (id && id !== 'new') {
      loadNote();
    } else if (id === 'new') {
      // Nouvelle note
      setIsEditing(true);
      setTitle('Nouvelle note');
      setContent('# Nouvelle note\\n\\nCommencez à écrire votre contenu ici...');
      setLoading(false);
    }
  }, [id]);

  // Configuration Socket.io
  useEffect(() => {
    if (!id || id === 'new') return;

    // Rejoindre la note
    socketService.joinNote(id);

    // Écouter les événements
    const handleNoteJoined = (data: any) => {
      setConnectedUsers(data.connectedUsers);
    };

    const handleUserJoined = (data: any) => {
      setConnectedUsers(prev => [...prev, data.user]);
      toastService.info(`${data.user.nom} a rejoint la note`);
    };

    const handleUserLeft = (data: any) => {
      setConnectedUsers(prev => prev.filter(u => u.id !== data.user.id));
      toastService.info(`${data.user.nom} a quitté la note`);
    };

    const handleContentChanged = (data: any) => {
      if (data.changedBy.id !== user?._id) {
        setContent(data.content);
        setHasUnsavedChanges(false);
        toastService.info(`Modification par ${data.changedBy.nom}`, '', 2000);
      }
    };

    const handleNoteSaved = (data: any) => {
      if (data.savedBy.id !== user?._id) {
        toastService.success(`Note sauvegardée par ${data.savedBy.nom}`, '', 2000);
      }
      setHasUnsavedChanges(false);
    };

    const handleVersionConflict = (data: any) => {
      toastService.warning('Conflit de version détecté. La note a été mise à jour.', 'Conflit');
      setContent(data.serverContent);
    };

    // Abonnements
    socketService.onNoteJoined(handleNoteJoined);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onContentChanged(handleContentChanged);
    socketService.onNoteSaved(handleNoteSaved);
    socketService.onVersionConflict(handleVersionConflict);

    return () => {
      socketService.leaveNote();
      socketService.off('noteJoined');
      socketService.off('userJoined');
      socketService.off('userLeft');
      socketService.off('contentChanged');
      socketService.off('noteSaved');
      socketService.off('versionConflict');
    };
  }, [id, user]);

  const loadNote = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await apiService.getNoteById(id);
      
      if (response.success && response.data) {
        const noteData = response.data;
        setNote(noteData);
        setTitle(noteData.titre);
        setContent(noteData.contenu);
        
        // Vérifier les permissions d'écriture
        const canEdit = noteData.auteur._id === user?._id || 
                       noteData.collaborateurs.some(c => 
                         c.userId._id === user?._id && ['ecriture', 'admin'].includes(c.permission)
                       );
        setIsEditing(canEdit);
      } else {
        toastService.error('Note introuvable', 'Erreur');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toastService.error('Erreur lors du chargement de la note', 'Erreur');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);

    // Envoyer les changements en temps réel si ce n'est pas une nouvelle note
    if (id && id !== 'new' && socketService.isConnected()) {
      socketService.sendContentChange({
        noteId: id,
        content: newContent,
        version: note?.version || 1
      });
    }
  }, [id, note?.version]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toastService.error('Le titre et le contenu sont requis', 'Erreur');
      return;
    }

    try {
      setSaving(true);

      if (id === 'new') {
        // Créer une nouvelle note
        const response = await apiService.createNote({
          titre: title.trim(),
          contenu: content.trim(),
          tags: [],
          isPublic: false,
          couleur: '#ffffff'
        });

        if (response.success && response.data) {
          toastService.success('Note créée avec succès', 'Succès');
          navigate(`/note/${response.data._id}`);
        }
      } else {
        // Mettre à jour la note existante
        const response = await apiService.updateNote(id!, {
          titre: title.trim(),
          contenu: content.trim()
        });

        if (response.success && response.data) {
          setNote(response.data);
          setHasUnsavedChanges(false);
          toastService.success('Note sauvegardée', 'Succès');
          
          // Notifier via Socket.io
          if (socketService.isConnected()) {
            socketService.saveNote(id!, content, title);
          }
        }
      }
    } catch (error: any) {
      toastService.error('Erreur lors de la sauvegarde', 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?')) {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleShareNote = async () => {
    if (!collaboratorEmail.trim() || !id) {
      toastService.error('Email requis', 'Erreur');
      return;
    }

    try {
      await apiService.addCollaborator(id, {
        email: collaboratorEmail.trim(),
        permission: 'ecriture'
      });
      
      toastService.success('Collaborateur ajouté avec succès', 'Succès');
      setCollaboratorEmail('');
      setShareDialogOpen(false);
      loadNote(); // Recharger pour afficher le nouveau collaborateur
    } catch (error: any) {
      toastService.error('Erreur lors de l\'ajout du collaborateur', 'Erreur');
    }
  };

  const canEdit = () => {
    if (!note || !user) return id === 'new';
    
    return note.auteur._id === user._id || 
           note.collaborateurs.some(c => 
             c.userId._id === user._id && ['ecriture', 'admin'].includes(c.permission)
           );
  };

  if (loading) {
    return <LoadingSpinner message="Chargement de la note..." />;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack sx={{ color: 'text.primary' }} />
          </IconButton>
          
          <TextField
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            variant="standard"
            placeholder="Titre de la note"
            disabled={!canEdit()}
            sx={{
              flexGrow: 1,
              mr: 2,
              '& .MuiInput-input': {
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'text.primary'
              }
            }}
          />

          {/* Utilisateurs connectés */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            {connectedUsers.slice(0, 3).map((connectedUser) => (
              <Tooltip key={connectedUser.id} title={connectedUser.nom}>
                <Avatar
                  src={connectedUser.avatar}
                  sx={{
                    width: 32,
                    height: 32,
                    mr: -1,
                    border: '2px solid white',
                    bgcolor: 'primary.main'
                  }}
                >
                  {connectedUser.nom.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
            {connectedUsers.length > 3 && (
              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'grey.300', color: 'text.primary' }}>
                +{connectedUsers.length - 3}
              </Avatar>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {canEdit() && (
              <Button
                variant={showPreview ? 'outlined' : 'contained'}
                onClick={() => setShowPreview(!showPreview)}
                startIcon={showPreview ? <EditIcon /> : <Visibility />}
                size="small"
              >
                {showPreview ? 'Éditer' : 'Aperçu'}
              </Button>
            )}
            
            {canEdit() && (
              <Badge variant="dot" color="warning" invisible={!hasUnsavedChanges}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={<Save />}
                  size="small"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </Badge>
            )}

            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVert sx={{ color: 'text.primary' }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Contenu principal */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Éditeur */}
        <Box
          sx={{
            flex: showPreview ? 0.5 : 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: showPreview ? '1px solid rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <TextField
            multiline
            fullWidth
            variant="standard"
            placeholder="Commencez à écrire votre note en Markdown..."
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            disabled={!canEdit()}
            InputProps={{
              disableUnderline: true,
              sx: {
                p: 3,
                height: '100%',
                alignItems: 'flex-start',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '14px',
                lineHeight: 1.6,
                '& textarea': {
                  height: '100% !important',
                  overflow: 'auto !important'
                }
              }
            }}
            sx={{
              flex: 1,
              '& .MuiInputBase-root': {
                height: '100%'
              }
            }}
          />
        </Box>

        {/* Aperçu */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            style={{ flex: 0.5, overflow: 'auto' }}
          >
            <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                      {children}
                    </Typography>
                  ),
                  h2: ({ children }) => (
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                      {children}
                    </Typography>
                  ),
                  h3: ({ children }) => (
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                      {children}
                    </Typography>
                  ),
                  p: ({ children }) => (
                    <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 2 }}>
                      {children}
                    </Typography>
                  ),
                  code: ({ children }) => (
                    <Box
                      component="code"
                      sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        bgcolor: 'grey.100',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.9em'
                      }}
                    >
                      {children}
                    </Box>
                  ),
                  pre: ({ children }) => (
                    <Box
                      component="pre"
                      sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        bgcolor: 'grey.900',
                        color: 'white',
                        p: 2,
                        borderRadius: 2,
                        overflow: 'auto',
                        fontSize: '0.9em',
                        my: 2
                      }}
                    >
                      {children}
                    </Box>
                  )
                }}
              >
                {content || '*Aucun contenu à afficher*'}
              </ReactMarkdown>
            </Box>
          </motion.div>
        )}
      </Box>

      {/* Menu des options */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setShareDialogOpen(true); setMenuAnchor(null); }}>
          <PersonAdd sx={{ mr: 2 }} />
          Partager
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <People sx={{ mr: 2 }} />
          Collaborateurs ({note?.collaborateurs.length || 0})
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          {note?.isPublic ? <Lock sx={{ mr: 2 }} /> : <Public sx={{ mr: 2 }} />}
          {note?.isPublic ? 'Rendre privée' : 'Rendre publique'}
        </MenuItem>
      </Menu>

      {/* Dialog de partage */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Partager la note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email du collaborateur"
            type="email"
            value={collaboratorEmail}
            onChange={(e) => setCollaboratorEmail(e.target.value)}
            margin="normal"
            placeholder="exemple@email.com"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            La personne recevra une invitation par email et pourra modifier cette note.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleShareNote} variant="contained">
            Partager
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotePage;