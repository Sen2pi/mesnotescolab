import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  ListItemIcon,
  ListItemText,
  Grid
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
  Lock,
  AccountTree,
  Delete,
  Description,
  Note as NoteIcon,
  FileUpload,
  FileDownload,
  Print
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from '../components/MarkdownRenderer';

import { useAuth } from '../contexts/AuthContext';
import { Note, SocketUser, Workspace } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import { toastService } from '../components/NotificationToast';
import LoadingSpinner from '../components/LoadingSpinner';
import NoteHierarchy from '../components/NoteHierarchy';
import NoteHeader from '../components/NoteHeader';
import ImportMarkdownDialog from '../components/ImportMarkdownDialog';
import { useTranslation } from 'react-i18next';
import { exportAsMarkdown, generateFilename } from '../utils/markdownExport';
import { exportAsPDF, prepareElementForPDF } from '../utils/pdfExport';

const NotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hierarchyDialogOpen, setHierarchyDialogOpen] = useState(false);
  const [childrenMenuAnchor, setChildrenMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedParentNote, setSelectedParentNote] = useState<string>('');
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isSettingParent, setIsSettingParent] = useState<boolean>(false);
  const [isSettingChild, setIsSettingChild] = useState<boolean>(false);
  const [selectedChildNote, setSelectedChildNote] = useState<string>('');
  const [availableChildNotes, setAvailableChildNotes] = useState<Note[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<SocketUser[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const parentId = searchParams.get('parent');
    const setParent = searchParams.get('setParent');
    const setChild = searchParams.get('setChild');

    if (id === 'new') {
      setTitle('Nouvelle note');
      setContent('# Nouvelle note\n\nCommencez à écrire votre contenu ici...');
      setSelectedWorkspace('');
      setSelectedParentNote(parentId || '');
      setIsSettingParent(false);
      setIsSettingChild(false);
      setIsEditing(true); // Nova nota sempre em modo de edição
      setLoading(false); // Definir loading como false para nova nota
      loadWorkspaces();
      loadAvailableNotes();
      if (parentId) {
        loadParentNote(parentId);
      }
    } else {
      loadNote();
      if (setParent === 'true') {
        setIsSettingParent(true);
        setIsSettingChild(false);
        loadAvailableNotes();
      } else if (setChild === 'true') {
        setIsSettingChild(true);
        setIsSettingParent(false);
        loadAvailableChildNotes();
      } else {
        setIsSettingParent(false);
        setIsSettingChild(false);
      }
    }
  }, [id, searchParams]);

  const loadWorkspaces = async () => {
    try {
      const response = await apiService.getWorkspaces();
      if (response.success && response.data) {
        setWorkspaces(response.data);
        // Se não há workspace selecionado, usar o primeiro disponível
        if (!selectedWorkspace && response.data.length > 0) {
          setSelectedWorkspace(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
    }
  };

  const loadAvailableNotes = async () => {
    try {
      const response = await apiService.getNotes({ limit: 100 });
      if (response.success && response.data) {
        setAvailableNotes(response.data.notes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar notas disponíveis:', error);
    }
  };

  const loadParentNote = async (parentId: string) => {
    try {
      const response = await apiService.getNoteById(parentId);
      if (response.success && response.data) {
        const parentNote = response.data;
        setTitle(`Nouvelle note - ${parentNote.titre}`);
        setContent(`# Nouvelle note liée à "${parentNote.titre}"\\n\\nCommencez à écrire votre contenu ici...`);
        
        // Usar o workspace da nota pai
        if (parentNote.workspace) {
          setSelectedWorkspace(parentNote.workspace._id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar nota pai:', error);
    }
  };

  const loadAvailableChildNotes = async () => {
    try {
      const response = await apiService.getNotes({ limit: 100 });
      if (response.success && response.data?.notes) {
        // Filtrar notas que não são a atual e que não têm pai
        const availableNotes = response.data.notes.filter(
          (note: Note) => note._id !== id && !note.parent
        );
        setAvailableChildNotes(availableNotes);
      }
    } catch (error) {
      console.error('Erro ao carregar notas filhas disponíveis:', error);
    }
  };

  // Configuration Socket.io
  useEffect(() => {
    if (!id || id === 'new') return;

    // Rejoindre la note
    socketService.joinNote(id);

    // Écouter les événements
    const handleNoteJoined = (data: any) => {
  
      setConnectedUsers(data.connectedUsers || []);
    };

    const handleUserJoined = (data: any) => {
  
      setConnectedUsers(prev => {
        const existing = prev.find(u => u.id === data.user.id);
        if (!existing) {
          return [...prev, data.user];
        }
        return prev;
      });
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
      // Cleanup mais robusto
      try {
        socketService.leaveNote();
      } catch (error) {
        console.warn('Erro ao sair da nota:', error);
      }
      
      // Remover listeners
      socketService.off('noteJoined');
      socketService.off('userJoined');
      socketService.off('userLeft');
      socketService.off('contentChanged');
      socketService.off('noteSaved');
      socketService.off('versionConflict');
    };
  }, [id, user?._id]);

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
        console.error('❌ Resposta inválida:', response);
        toastService.error('Note introuvable', 'Erreur');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar nota:', {
        status: error.status,
        message: error.message,
        data: error.data
      });
      
      if (error.status === 403) {
        toastService.error('Você não tem permissão para visualizar esta nota', 'Permissão Negada');
      } else if (error.status === 404) {
        toastService.error('Nota não encontrada', 'Erreur');
      } else {
        toastService.error('Erreur lors du chargement de la note', 'Erreur');
      }
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSetParent = async () => {
    if (!selectedParentNote || !note) return;

    try {
      setSaving(true);
      const response = await apiService.updateNote(note._id, {
        parent: selectedParentNote
      });

      if (response.success) {
        toastService.success(t('notes.saveSuccess'), t('common.success'));
        setIsSettingParent(false);
        setSelectedParentNote('');
        loadNote(); // Recarregar a nota
      } else {
        toastService.error(response.message || t('notes.saveError'), t('common.error'));
      }
    } catch (error: any) {
      console.error('Erro ao definir nota pai:', error);
      toastService.error(t('notes.saveError'), t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetChild = async () => {
    if (!selectedChildNote || !note) return;

    try {
      setSaving(true);
      const response = await apiService.updateNote(selectedChildNote, {
        parent: note._id
      });

      if (response.success) {
        toastService.success(t('notes.saveSuccess'), t('common.success'));
        setIsSettingChild(false);
        setSelectedChildNote('');
        loadNote(); // Recarregar a nota
      } else {
        toastService.error(response.message || t('notes.saveError'), t('common.error'));
      }
    } catch (error: any) {
      console.error('Erro ao definir nota filha:', error);
      toastService.error(t('notes.saveError'), t('common.error'));
    } finally {
      setSaving(false);
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

    if (id === 'new' && !selectedWorkspace) {
      toastService.error('Veuillez sélectionner un workspace', 'Erreur');
      return;
    }

    // Verificar se há um parent na URL ou no seletor
    const parentId = searchParams.get('parent') || selectedParentNote;

    

    try {
      setSaving(true);

      if (id === 'new') {

        
        // Créer une nouvelle note
        const response = await apiService.createNote({
          titre: title.trim(),
          contenu: content.trim(),
          workspace: selectedWorkspace,
          parent: parentId || undefined,
          tags: [],
          isPublic: false,
          couleur: '#ffffff'
        });

        

        if (response.success && response.data) {
          toastService.success('Note créée avec succès', 'Succès');
          navigate(`/note/${response.data._id}`);
        }
      } else {
        
        
        // Mettre à jour la note existente
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
      console.error('❌ Erro ao salvar nota:', error);
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
      loadNote(); // Recharger para afficher o novo colaborador
    } catch (error: any) {
      toastService.error('Erreur lors de l\'ajout du collaborateur', 'Erreur');
    }
  };

  const canEdit = (): boolean => {
    if (!note || !user) return id === 'new';
    
    const isAuthor = Boolean(note.auteur?._id === user._id);
    const collaborator = note.collaborateurs.find(c => c.userId?._id === user._id);
    const hasWritePermission = Boolean(collaborator && ['ecriture', 'admin'].includes(collaborator.permission));
    const canEditNote = isAuthor || hasWritePermission;
    

    
    return canEditNote;
  };

  // Função para importar arquivo markdown
  const handleImportMarkdown = (importedContent: string, filename: string) => {
    setContent(importedContent);
    setHasUnsavedChanges(true);
    toastService.success(t('notes.import.importSuccess'), t('common.success'));
  };

  // Função para exportar como markdown
  const handleExportMarkdown = () => {
    try {
      const filename = generateFilename(title);
      exportAsMarkdown(content, filename);
      toastService.success(t('notes.export.exportSuccess'), t('common.success'));
    } catch (error) {
      toastService.error(t('notes.export.exportError'), t('common.error'));
    }
  };

  // Função para imprimir como PDF
  const handlePrintPDF = async () => {
    try {
      setPrintLoading(true);
      
      // Encontrar o elemento de preview
      const previewElement = document.querySelector('.markdown-preview') as HTMLElement;
      if (!previewElement) {
        // Se não há preview, usar o editor
        const editorElement = document.querySelector('.markdown-editor') as HTMLElement;
        if (!editorElement) {
          throw new Error('Elemento não encontrado');
        }
        
        // Criar um elemento temporário com o conteúdo renderizado
        const tempElement = document.createElement('div');
        tempElement.innerHTML = content;
        tempElement.style.padding = '20px';
        tempElement.style.fontFamily = 'Arial, sans-serif';
        tempElement.style.fontSize = '12px';
        tempElement.style.lineHeight = '1.5';
        tempElement.style.backgroundColor = '#ffffff';
        tempElement.style.color = '#000000';
        
        const preparedElement = prepareElementForPDF(tempElement);
        await exportAsPDF(preparedElement, {
          title: title,
          filename: `${generateFilename(title)}.pdf`
        });
      } else {
        const preparedElement = prepareElementForPDF(previewElement);
        await exportAsPDF(preparedElement, {
          title: title,
          filename: `${generateFilename(title)}.pdf`
        });
      }
      
      toastService.success(t('notes.print.printSuccess'), t('common.success'));
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toastService.error(t('notes.print.printError'), t('common.error'));
    } finally {
      setPrintLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement de la note..." />;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <NoteHeader
        title={title}
        onTitleChange={(newTitle) => {
          setTitle(newTitle);
          setHasUnsavedChanges(true);
        }}
        onBackClick={handleBack}
        onSave={handleSave}
        onMenuClick={(e) => setMenuAnchor(e.currentTarget)}
        onPreviewToggle={() => setShowPreview(!showPreview)}
        canEdit={canEdit()}
        showPreview={showPreview}
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
      />

      {/* Seletores para novas notas */}
      {id === 'new' && (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('notes.workspace')}</InputLabel>
                <Select
                  value={selectedWorkspace}
                  onChange={(e) => setSelectedWorkspace(e.target.value)}
                  label={t('notes.workspace')}
                >
                  <MenuItem value="">
                    <em>{t('common.select')}</em>
                  </MenuItem>
                  {workspaces.map((workspace) => (
                    <MenuItem key={workspace._id} value={workspace._id}>
                      {workspace.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('notes.hierarchy.selectParent')}</InputLabel>
                <Select
                  value={selectedParentNote}
                  onChange={(e) => setSelectedParentNote(e.target.value)}
                  label={t('notes.hierarchy.selectParent')}
                >
                  <MenuItem value="">
                    <em>{t('notes.hierarchy.noParent')}</em>
                  </MenuItem>
                  {availableNotes
                    .filter(note => note.workspace?._id === selectedWorkspace)
                    .map((note) => (
                      <MenuItem key={note._id} value={note._id}>
                        {note.titre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Chip indicando que é uma nota filha */}
          {selectedParentNote && (
            <Chip
              label={t('notes.hierarchy.childNote')}
              size="small"
              variant="outlined"
              color="secondary"
              sx={{ mt: 1, fontSize: '0.75rem' }}
            />
          )}
        </Box>
      )}

      {/* Informações para notas existentes */}
      {id !== 'new' && note && (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {/* Workspace da nota existente */}
            {note.workspace && (
              <Chip
                label={note.workspace?.nom}
                size="small"
                sx={{
                  bgcolor: note.workspace?.couleur || 'primary.main',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            )}

            {/* Nota pai (para notas existentes) */}
            {note.parent && (
              <Chip
                label={`${t('notes.hierarchy.parent')}: ${note.parent?.titre}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
                onClick={() => note.parent?._id && navigate(`/note/${note.parent._id}`)}
                clickable
              />
            )}

            {/* Notas filhas (para notas existentes) */}
            {note.enfants && note.enfants.length > 0 && (
              <Chip
                label={t('notes.hierarchy.childrenCount', { count: note.enfants.length })}
                size="small"
                variant="outlined"
                color="secondary"
                sx={{ fontSize: '0.75rem' }}
                onClick={() => setChildrenMenuAnchor(document.getElementById('children-menu-trigger'))}
                clickable
              />
            )}

            {/* Utilisateurs connectés */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
              {connectedUsers.slice(0, 3).map((connectedUser) => (
                <Tooltip key={connectedUser.id} title={connectedUser.nom}>
                  <Avatar
                    src={connectedUser.avatar}
                    sx={{
                      width: 32,
                      height: 32,
                      mr: -1,
                      border: '2px solid',
                      borderColor: 'background.paper',
                      bgcolor: 'primary.main'
                    }}
                  >
                    {connectedUser.nom.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
              {connectedUsers.length > 3 && (
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  mr: 1, 
                  bgcolor: 'grey.300', 
                  color: 'text.primary' 
                }}>
                  +{connectedUsers.length - 3}
                </Avatar>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Menu de notas filhas */}
      <Menu
        anchorEl={childrenMenuAnchor}
        open={Boolean(childrenMenuAnchor)}
        onClose={() => setChildrenMenuAnchor(null)}
        PaperProps={{
          sx: { maxHeight: 300, width: 250 }
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {t('notes.hierarchy.children')}
          </Typography>
        </MenuItem>
        <Divider />
        {note?.enfants?.map((childNote) => (
          <MenuItem
            key={childNote._id}
            onClick={() => {
              setChildrenMenuAnchor(null);
              navigate(`/note/${childNote._id}`);
            }}
          >
            <ListItemIcon>
              <NoteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={childNote.titre}
              secondary={childNote.derniereActivite ? new Date(childNote.derniereActivite).toLocaleDateString() : ''}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Contenu principal */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Éditeur */}
        <Box
          sx={{
            flex: showPreview ? 0.5 : 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: showPreview ? '1px solid' : 'none',
            borderColor: 'divider'
          }}
        >
          <TextField
            className="markdown-editor"
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
                color: 'text.primary',
                '& textarea': {
                  height: '100% !important',
                  overflow: 'auto !important'
                }
              }
            }}
            sx={{
              flex: 1,
              bgcolor: 'background.default',
              '& .MuiInputBase-root': {
                height: '100%'
              }
            }}
          />
        </Box>

        {/* Aperçu */}
        {showPreview && (
          <Box
            sx={{
              flex: 0.5,
              p: 3,
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderLeft: '1px solid',
              borderColor: 'divider'
            }}
          >
            <MarkdownRenderer content={content} />
          </Box>
        )}
      </Box>

      {/* Menu des options */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {canEdit() && (
          <MenuItem onClick={() => { setShareDialogOpen(true); setMenuAnchor(null); }}>
            <PersonAdd sx={{ mr: 2 }} />
            Partager
          </MenuItem>
        )}
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <People sx={{ mr: 2 }} />
          Collaborateurs ({note?.collaborateurs.length || 0})
        </MenuItem>
        {canEdit() && (
          <MenuItem onClick={() => setMenuAnchor(null)}>
            {note?.isPublic ? <Lock sx={{ mr: 2 }} /> : <Public sx={{ mr: 2 }} />}
            {note?.isPublic ? 'Rendre privée' : 'Rendre publique'}
          </MenuItem>
        )}
        {canEdit() && (
          <MenuItem onClick={() => { setHierarchyDialogOpen(true); setMenuAnchor(null); }}>
            <AccountTree sx={{ mr: 2 }} />
            Hiérarchie
          </MenuItem>
        )}
        
        {/* Import/Export/Print options */}
        <Divider />
        {canEdit() && (
          <MenuItem onClick={() => { setImportDialogOpen(true); setMenuAnchor(null); }}>
            <FileUpload sx={{ mr: 2 }} />
            {t('notes.import.title')}
          </MenuItem>
        )}
        <MenuItem onClick={() => { handleExportMarkdown(); setMenuAnchor(null); }}>
          <FileDownload sx={{ mr: 2 }} />
          {t('notes.export.title')}
        </MenuItem>
        <MenuItem 
          onClick={() => { handlePrintPDF(); setMenuAnchor(null); }}
          disabled={printLoading}
        >
          <Print sx={{ mr: 2 }} />
          {printLoading ? t('notes.print.preparing') : t('notes.print.title')}
        </MenuItem>
        
        <Divider />
        {canEdit() && note && id && id !== 'new' && (
          <MenuItem 
            onClick={async () => {
              try {
                const response = await apiService.deleteNote(id);
                if (response.success) {
                  toastService.success('Note supprimée avec succès');
                  navigate('/dashboard');
                }
              } catch (error) {
                toastService.error('Erreur lors de la suppression');
              }
              setMenuAnchor(null);
            }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 2 }} />
            Supprimer
          </MenuItem>
        )}
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

      {/* Dialog de hiérarchie */}
      <NoteHierarchy
        open={hierarchyDialogOpen}
        onClose={() => setHierarchyDialogOpen(false)}
        currentNote={note || undefined}
        onNoteUpdated={(updatedNote) => {
          setNote(updatedNote);
          toastService.success('Hiérarchie mise à jour avec succès');
        }}
      />

      {/* Interface para definir nota pai */}
      {isSettingParent && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('notes.hierarchy.setParentNote')}
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('notes.hierarchy.selectParent')}</InputLabel>
            <Select
              value={selectedParentNote}
              onChange={(e) => setSelectedParentNote(e.target.value)}
              label={t('notes.hierarchy.selectParent')}
            >
              <MenuItem value="">
                <em>{t('notes.hierarchy.noParent')}</em>
              </MenuItem>
              {availableNotes
                .filter(note => note._id !== id)
                .map((note) => (
                  <MenuItem key={note._id} value={note._id}>
                    {note.titre}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSetParent}
              disabled={saving}
            >
              {saving ? t('common.loading') : t('common.save')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsSettingParent(false);
                setSelectedParentNote('');
              }}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </Box>
      )}

      {/* Interface para definir nota filha */}
      {isSettingChild && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('notes.hierarchy.setChildNote')}
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('notes.hierarchy.children')}</InputLabel>
            <Select
              value={selectedChildNote}
              onChange={(e) => setSelectedChildNote(e.target.value)}
              label={t('notes.hierarchy.children')}
            >
              <MenuItem value="">
                <em>{t('notes.hierarchy.noChildren')}</em>
              </MenuItem>
              {availableChildNotes.map((note) => (
                <MenuItem key={note._id} value={note._id}>
                  {note.titre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSetChild}
              disabled={saving}
            >
              {saving ? t('common.loading') : t('common.save')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsSettingChild(false);
                setSelectedChildNote('');
              }}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </Box>
      )}

      {/* Dialog de importação de markdown */}
      <ImportMarkdownDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportMarkdown}
      />
    </Box>
  );
};

export default NotePage;