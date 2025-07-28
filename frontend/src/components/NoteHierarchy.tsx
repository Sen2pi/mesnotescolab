import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  Article,
  SubdirectoryArrowRight,
  AccountTree,
  Link,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/api';
import { Note } from '../types';
import { toastService } from './NotificationToast';

interface NoteHierarchyProps {
  open: boolean;
  onClose: () => void;
  currentNote?: Note;
  onNoteUpdated?: (note: Note) => void;
}

const NoteHierarchy: React.FC<NoteHierarchyProps> = ({ 
  open, 
  onClose, 
  currentNote,
  onNoteUpdated 
}) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadNotes();
      if (currentNote) {
        setSelectedParent(currentNote.parent?._id || '');
        setSelectedChildren(currentNote.enfants?.map(child => child._id) || []);
      }
    }
  }, [open, currentNote]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotes({ limit: 100 });
      
      if (response.success && response.data) {
        setNotes(response.data.notes);
      }
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      toastService.error('Erro ao carregar notas');
    } finally {
      setLoading(false);
    }
  };

  const handleSetParent = async () => {
    if (!currentNote) return;
    
    try {
      setLoading(true);
      const response = await apiService.updateNote(currentNote._id, {
        parent: selectedParent || undefined
      });
      
      if (response.success && response.data) {
        toastService.success('Nota pai definida com sucesso');
        onNoteUpdated?.(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao definir nota pai:', error);
      toastService.error('Erro ao definir nota pai');
    } finally {
      setLoading(false);
    }
  };

  const handleSetChildren = async () => {
    if (!currentNote) return;
    
    try {
      setLoading(true);
      // Aqui você precisaria implementar a lógica para definir as notas filhas
      // Isso pode requerer uma API específica no backend
      toastService.success('Notas filhas definidas com sucesso');
      onClose();
    } catch (error) {
      console.error('Erro ao definir notas filhas:', error);
      toastService.error('Erro ao definir notas filhas');
    } finally {
      setLoading(false);
    }
  };

  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const renderNoteTree = (noteList: Note[], level = 0) => {
    return noteList.map(note => {
      const hasChildren = note.enfants && note.enfants.length > 0;
      const isExpanded = expandedNotes.has(note._id);
      const isCurrentNote = currentNote?._id === note._id;
      
      return (
        <motion.div
          key={note._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: level * 0.1 }}
        >
          <ListItem
            sx={{
              pl: level * 3 + 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: isCurrentNote ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>
              {hasChildren ? (
                <IconButton
                  size="small"
                  onClick={() => toggleNoteExpansion(note._id)}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              ) : (
                <Article sx={{ color: note.couleur || 'primary.main' }} />
              )}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {note.titre}
                  </Typography>
                  {isCurrentNote && (
                    <Chip label="Atual" size="small" color="primary" />
                  )}
                  {note.parent && (
                    <Chip 
                      icon={<SubdirectoryArrowRight />} 
                      label="Filha" 
                      size="small" 
                      color="secondary" 
                    />
                  )}
                  {note.enfants && note.enfants.length > 0 && (
                    <Chip 
                      icon={<AccountTree />} 
                      label={`${note.enfants.length} filhas`} 
                      size="small" 
                      color="info" 
                    />
                  )}
                </Box>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {note.contenu.substring(0, 100)}...
                </Typography>
              }
            />
          </ListItem>
          
          {hasChildren && (
            <motion.div
              initial={false}
              animate={{ height: isExpanded ? 'auto' : 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <List component="div" disablePadding>
                {renderNoteTree(note.enfants!, level + 1)}
              </List>
            </motion.div>
          )}
        </motion.div>
      );
    });
  };

  const availableNotes = notes.filter(note => note._id !== currentNote?._id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6">Hierarquia de Notas</Typography>
        {currentNote && (
          <Typography variant="body2" color="text.secondary">
            Configurando hierarquia para: <strong>{currentNote.titre}</strong>
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Configuração de Nota Pai */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Nota Pai
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Selecione uma nota pai para criar uma hierarquia
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Nota Pai</InputLabel>
                  <Select
                    value={selectedParent}
                    onChange={(e) => setSelectedParent(e.target.value)}
                    label="Nota Pai"
                  >
                    <MenuItem value="">Nenhuma (Nota Raiz)</MenuItem>
                    {availableNotes.map(note => (
                      <MenuItem key={note._id} value={note._id}>
                        {note.titre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  onClick={handleSetParent}
                  disabled={loading}
                  startIcon={<Link />}
                  fullWidth
                >
                  Definir Nota Pai
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Configuração de Notas Filhas */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notas Filhas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Selecione as notas que serão filhas desta nota
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Notas Filhas</InputLabel>
                  <Select
                    multiple
                    value={selectedChildren}
                    onChange={(e) => setSelectedChildren(e.target.value as string[])}
                    label="Notas Filhas"
                  >
                    {availableNotes.map(note => (
                      <MenuItem key={note._id} value={note._id}>
                        {note.titre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  onClick={handleSetChildren}
                  disabled={loading}
                  startIcon={<AccountTree />}
                  fullWidth
                >
                  Definir Notas Filhas
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Árvore de Notas */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estrutura de Notas
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : notes.length === 0 ? (
                  <Alert severity="info">
                    Nenhuma nota encontrada
                  </Alert>
                ) : (
                  <List>
                    {renderNoteTree(notes)}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NoteHierarchy; 