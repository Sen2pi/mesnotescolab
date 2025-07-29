import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Breadcrumbs,
  Link,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Folder,
  Workspaces,
  People,
  ExpandMore,
  ExpandLess,
  ArrowBack,
  ArrowForward,
  Description,
  SubdirectoryArrowRight,
  KeyboardArrowRight,
  KeyboardArrowDown,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  AccountTree
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Note, Workspace, Folder as FolderType } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import AppHeader from '../components/AppHeader';
import WorkIcon from '@mui/icons-material/Work';
import FolderIcon from '@mui/icons-material/Folder';
import NoteIcon from '@mui/icons-material/Description';
import ArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface HierarchyItem {
  id: string;
  name: string;
  type: 'workspace' | 'folder' | 'note';
  children?: HierarchyItem[];
  workspace?: Workspace;
  folder?: FolderType;
  note?: Note;
  level: number;
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState<HierarchyItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<{ type: 'workspace' | 'folder', workspace?: Workspace, folder?: FolderType } | null>(null);

  // Verificar autenticação
  useEffect(() => {
    console.log('🔍 DashboardPage - Verificando autenticação:', { user, isAuthenticated });
    
    if (!isAuthenticated) {
      console.log('❌ Usuário não autenticado, redirecionando para login');
      navigate('/login');
      return;
    }
    
    console.log('✅ DashboardPage - Usuário autenticado, carregando dados');
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar notas
      const notesResponse = await apiService.getNotes({ limit: 20 });
      if (notesResponse.success && notesResponse.data) {
        setNotes(notesResponse.data.notes || []);
      }
      
      // Carregar workspaces
      const workspacesResponse = await apiService.getWorkspaces();
      if (workspacesResponse.success && workspacesResponse.data) {
        setWorkspaces(workspacesResponse.data);
      }
      
      // Por enquanto, usar array vazio para folders
      setFolders([]);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const handleNoteMenuClick = (event: React.MouseEvent<HTMLElement>, noteId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedNoteId(noteId);
  };

  const handleArchiveNote = async () => {
    if (!selectedNoteId) return;
    
    try {
      await apiService.archiveNote(selectedNoteId);
      console.log('✅ Nota arquivada com sucesso');
      loadData(); // Recarregar dados
    } catch (error) {
      console.error('❌ Erro ao arquivar nota:', error);
    } finally {
      setMenuAnchor(null);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;
    
    try {
      await apiService.deleteNote(selectedNoteId);
      console.log('✅ Nota excluída com sucesso');
      loadData(); // Recarregar dados
    } catch (error) {
      console.error('❌ Erro ao excluir nota:', error);
    } finally {
      setMenuAnchor(null);
    }
  };

  const handleCreateChildNote = () => {
    if (selectedNoteId) {
      navigate(`/note/new?parent=${selectedNoteId}`);
    }
    setMenuAnchor(null);
  };

  const handleSetParentNote = () => {
    if (selectedNoteId) {
      navigate(`/note/${selectedNoteId}?setParent=true`);
    }
    setMenuAnchor(null);
  };

  const handleSetChildNote = () => {
    if (selectedNoteId) {
      navigate(`/note/${selectedNoteId}?setChild=true`);
    }
    setMenuAnchor(null);
  };

  const canArchiveNote = (note: Note) => {
    if (!user) return false;
    if (note.auteur?._id === user._id) return true;
    const collaborator = note.collaborateurs.find(c => c.userId?._id === user._id);
    const canArchive = collaborator && ['admin'].includes(collaborator.permission);
    console.log('🔍 Verificando permissão de arquivamento:', {
      noteId: note._id,
      noteTitle: note.titre,
      userId: user._id,
      isAuthor: note.auteur?._id === user._id,
      collaborator: collaborator,
      collaboratorPermission: collaborator?.permission,
      canArchive
    });
    return canArchive;
  };

  const canDeleteNote = (note: Note) => {
    if (!user) return false;
    if (note.auteur?._id === user._id) return true;
    const collaborator = note.collaborateurs.find(c => c.userId?._id === user._id);
    const canDelete = collaborator && ['admin'].includes(collaborator.permission);
    console.log('🔍 Verificando permissão de exclusão:', {
      noteId: note._id,
      noteTitle: note.titre,
      userId: user._id,
      isAuthor: note.auteur?._id === user._id,
      collaborator: collaborator,
      collaboratorPermission: collaborator?.permission,
      canDelete
    });
    return canDelete;
  };

  const getCollaboratorCount = (note: Note) => {
    return note.collaborateurs?.length || 0;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para construir a hierarquia
  const buildHierarchy = () => {
    console.log('🔍 Construindo hierarquia:', {
      workspaces: workspaces.length,
      folders: folders.length,
      notes: notes.length
    });

    const hierarchyItems: HierarchyItem[] = [];
    
    // Adicionar workspaces
    workspaces.forEach(workspace => {
      console.log('🔍 Processando workspace:', workspace.nom, workspace._id);
      
      const workspaceItem: HierarchyItem = {
        id: `workspace-${workspace._id}`,
        name: workspace.nom,
        type: 'workspace',
        workspace,
        level: 0
      };
      
      // Encontrar folders deste workspace
      const workspaceFolders = folders.filter(folder => folder.workspace?._id === workspace._id);
      console.log('🔍 Folders encontrados para workspace:', workspaceFolders.length);
      
      workspaceItem.children = workspaceFolders.map(folder => {
        const folderItem: HierarchyItem = {
          id: `folder-${folder._id}`,
          name: folder.nom,
          type: 'folder',
          folder,
          level: 1
        };
        
        // Encontrar notas deste folder (apenas notas raiz - sem parent)
        const folderNotes = notes.filter(note => 
          note.dossier?._id === folder._id && !note.parent
        );
        console.log('🔍 Notas raiz encontradas para folder:', folder.nom, folderNotes.length);
        
        folderItem.children = folderNotes.map(note => 
          buildNoteHierarchy(note, 2)
        );
        
        return folderItem;
      });
      
      // Adicionar notas sem folder (apenas notas raiz)
      const workspaceNotes = notes.filter(note => 
        note.workspace?._id === workspace._id && !note.dossier && !note.parent
      );
      console.log('🔍 Notas raiz sem folder para workspace:', workspaceNotes.length);
      
      workspaceItem.children = [
        ...workspaceItem.children,
        ...workspaceNotes.map(note => buildNoteHierarchy(note, 1))
      ];
      
      hierarchyItems.push(workspaceItem);
    });
    
    console.log('🔍 Hierarquia construída:', hierarchyItems);
    setHierarchy(hierarchyItems);
  };

  // Função recursiva para construir hierarquia de notas
  const buildNoteHierarchy = (note: Note, level: number): HierarchyItem => {
    // Usar os enfants populados do backend
    const childNotes = note.enfants || [];
    
    console.log('🔍 Notas filhas encontradas para:', note.titre, childNotes.length);
    
    const noteItem: HierarchyItem = {
      id: `note-${note._id}`,
      name: note.titre,
      type: 'note' as const,
      note,
      level,
      children: childNotes.length > 0 ? childNotes.map(childNote => 
        buildNoteHierarchy(childNote, level + 1)
      ) : undefined
    };
    
    return noteItem;
  };

  // Função para expandir/colapsar item
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Função para navegar para um item
  const navigateToItem = (item: HierarchyItem) => {
    if (item.type === 'note') {
      navigate(`/note/${item.note?._id}`);
    } else if (item.type === 'folder') {
      // Atualizar path e mostrar notas do folder
      setCurrentPath([...currentPath, item]);
      setCurrentFolder({
        type: 'folder',
        folder: item.folder
      });
    } else if (item.type === 'workspace') {
      // Atualizar workspace selecionado
      setSelectedWorkspace(item.workspace?._id || '');
      setCurrentPath([item]);
      setCurrentFolder({
        type: 'workspace',
        workspace: item.workspace
      });
    }
  };

  // Função para voltar ao pai
  const navigateToParent = () => {
    if (currentPath.length > 1) {
      setCurrentPath(currentPath.slice(0, -1));
      const parentItem = currentPath[currentPath.length - 2];
      if (parentItem.type === 'folder') {
        setCurrentFolder({
          type: 'folder',
          folder: parentItem.folder
        });
      } else if (parentItem.type === 'workspace') {
        setCurrentFolder({
          type: 'workspace',
          workspace: parentItem.workspace
        });
      }
    } else {
      setCurrentPath([]);
      setCurrentFolder(null);
    }
  };

  // Função para renderizar breadcrumbs
  const renderBreadcrumbs = () => (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}
    >
      <Link
        component="button"
        variant="body1"
        onClick={() => {
          setCurrentPath([]);
          setCurrentFolder(null);
        }}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <HomeIcon fontSize="small" />
        {t('dashboard.title')}
      </Link>
      
      {currentPath.map((item, index) => (
        <Link
          key={item.id}
          component="button"
          variant="body1"
          onClick={() => {
            const newPath = currentPath.slice(0, index + 1);
            setCurrentPath(newPath);
            setCurrentFolder({
              type: item.type as 'workspace' | 'folder',
              workspace: item.workspace,
              folder: item.folder
            });
          }}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          {item.type === 'workspace' && <WorkIcon fontSize="small" />}
          {item.type === 'folder' && <FolderIcon fontSize="small" />}
          {item.type === 'note' && <NoteIcon fontSize="small" />}
          {item.name}
        </Link>
      ))}
    </Breadcrumbs>
  );

  // Função para renderizar item da hierarquia
  const renderHierarchyItem = (item: HierarchyItem, depth: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const indent = depth * 20; // Indentação adequada

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ListItem
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
              borderRadius: 0.5
            },
            borderLeft: 'none', // Removida a linha roxa
            minHeight: '32px', // Altura um pouco maior
            mb: 0.25, // Margem entre itens
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={() => navigateToItem(item)}
        >
          <ListItemIcon sx={{ minWidth: 24, mr: 1 }}> {/* Espaço padrão entre ícone e texto */}
            {item.type === 'workspace' && <WorkIcon color="primary" fontSize="small" />}
            {item.type === 'folder' && <FolderIcon color="secondary" fontSize="small" />}
            {item.type === 'note' && <NoteIcon color="action" fontSize="small" />}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: item.type === 'note' ? 'normal' : 'medium',
                    fontSize: '0.875rem', // Tamanho de fonte padrão
                    textAlign: 'left',
                    lineHeight: 1.4 // Altura de linha normal
                  }}
                >
                  {item.name}
                </Typography>
                
                {/* Chip para nota pai */}
                {item.type === 'note' && item.note?.parent && (
                  <Chip
                    label={`${t('notes.hierarchy.parent')}: ${item.note.parent?.titre || t('dashboard.noTitle')}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', ml: 0.5, height: '20px' }} // Tamanho adequado
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.note?.parent?._id) {
                        navigate(`/note/${item.note.parent._id}`);
                      }
                    }}
                    clickable
                  />
                )}
                
                {/* Contador de notas filhas */}
                {item.type === 'note' && item.children && item.children.length > 0 && (
                  <Chip
                    label={t('notes.hierarchy.childrenCount', { count: item.children.length })}
                    size="small"
                    variant="outlined"
                    color="secondary"
                    sx={{ fontSize: '0.7rem', ml: 0.5, height: '20px' }} // Tamanho adequado
                  />
                )}
              </Box>
            }
            secondary={
              item.type === 'note' && item.note?.collaborateurs && item.note.collaborateurs.length > 0
                ? `${item.note.collaborateurs.length} ${t('notes.collaborators')}`
                : item.type === 'note' && item.children && item.children.length > 0
                ? t('notes.hierarchy.childrenCount', { count: item.children.length })
                : undefined
            }
            sx={{ 
              '& .MuiListItemText-secondary': { 
                fontSize: '0.75rem' // Tamanho de fonte adequado
              },
              '& .MuiListItemText-primary': {
                textAlign: 'left'
              }
            }}
          />
          
          {/* Botão expandir/recolher */}
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              sx={{ ml: 0.5, p: 0.5 }} // Padding adequado
            >
              {isExpanded ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
            </IconButton>
          )}
          
          {/* Menu de ações para notas */}
          {item.type === 'note' && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNoteId(item.note?._id || '');
                setMenuAnchor(e.currentTarget);
              }}
              sx={{ p: 0.5 }} // Padding adequado
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </ListItem>
        
        {/* Notas filhas expandidas */}
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 1 }}> {/* Padding adequado */}
              {item.children!.map(child => renderHierarchyItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </motion.div>
    );
  };

  // Função para renderizar notas do folder atual
  const renderFolderNotes = () => {
    const folderNotes = notes.filter(note => note.dossier?._id === currentFolder?.folder?._id);
    
    return (
      <Grid container spacing={2}>
        {folderNotes.map((note) => (
          <Grid key={note._id} size={{ xs: 12, sm: 6, md: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                sx={{
                  height: '140px', // Reduzido de 200px para 140px
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                    transition: 'all 0.2s ease-in-out'
                  },
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => handleNoteClick(note._id)}
              >
                <CardContent sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Header do card */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: '0.9rem', // Reduzido tamanho da fonte
                        fontWeight: 600,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {note.titre || t('dashboard.noTitle')}
                    </Typography>
                    
                    <IconButton
                      size="small"
                      onClick={(e) => handleNoteMenuClick(e, note._id)}
                      sx={{ p: 0.5 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Conteúdo do card */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.75rem', // Reduzido tamanho da fonte
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2, // Reduzido de 3 para 2 linhas
                      WebkitBoxOrient: 'vertical',
                      flexGrow: 1,
                      mb: 1
                    }}
                  >
                    {note.contenu ? note.contenu.substring(0, 80) + '...' : t('dashboard.noContent')}
                  </Typography>

                  {/* Footer do card */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Avatar
                        src={note.auteur?.avatar}
                        sx={{ width: 20, height: 20, fontSize: '0.7rem' }} // Reduzido tamanho
                      >
                        {note.auteur?.nom?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {note.auteur?.nom}
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {formatDate(note.derniereActivite)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    );
  };

  useEffect(() => {
    buildHierarchy();
  }, [workspaces, folders, notes]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader title={t('dashboard.title')} />

      <Box sx={{ p: 3 }}>
        {/* Breadcrumbs */}
        {currentPath.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {renderBreadcrumbs()}
          </Box>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {notes.length}
                </Typography>
                <Typography variant="body2">
                  {t('dashboard.stats.totalNotes')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {workspaces.length}
                </Typography>
                <Typography variant="body2">
                  {t('dashboard.stats.workspaces')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {folders.length}
                </Typography>
                <Typography variant="body2">
                  {t('dashboard.stats.folders')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {notes.filter(note => note.isArchived).length}
                </Typography>
                <Typography variant="body2">
                  {t('dashboard.stats.archivedNotes')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            fullWidth
            placeholder={t('dashboard.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/note/new')}
            sx={{ ml: 2 }}
          >
            {t('dashboard.createNote')}
          </Button>
        </Box>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Hierarchy Panel */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2, height: 'fit-content' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountTree />
                {t('dashboard.hierarchy')}
              </Typography>
              
              <List>
                {hierarchy.map(item => renderHierarchyItem(item))}
              </List>
            </Paper>
          </Grid>

          {/* Notes Grid */}
          <Grid size={{ xs: 12, md: 8 }}>
            {currentPath.length > 0 ? (
              // Mostrar notas do folder atual
              renderFolderNotes()
            ) : (
              // Mostrar todas as notas
              <Grid container spacing={2}>
                {notes.map((note) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={note._id}>
                    <Card
                      component={motion.div}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2
                        }
                      }}
                      onClick={() => handleNoteClick(note._id)}
                    >
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.3
                            }}
                          >
                            {note.titre}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleNoteMenuClick(e, note._id)}
                            sx={{ ml: 1, color: 'text.secondary' }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.4
                          }}
                        >
                          {note.contenu.replace(/[#*`]/g, '').substring(0, 150)}...
                        </Typography>

                        <Box sx={{ mt: 'auto' }}>
                          {/* Workspace */}
                          {note.workspace && (
                            <Chip
                              label={note.workspace?.nom}
                              size="small"
                              sx={{
                                mb: 1,
                                bgcolor: note.workspace?.couleur || 'primary.main',
                                color: 'white',
                                fontSize: '0.75rem'
                              }}
                            />
                          )}

                          {/* Tags */}
                          {note.tags && note.tags.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                              {note.tags.slice(0, 3).map((tag, index) => (
                                <Chip
                                  key={index}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              ))}
                              {note.tags.length > 3 && (
                                <Chip
                                  label={`+${note.tags.length - 3}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          )}

                          {/* Info da nota */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                src={note.auteur?.avatar}
                                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                              >
                                {note.auteur?.nom?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="caption" color="text.secondary">
                                {note.auteur?.nom}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getCollaboratorCount(note) > 0 && (
                                <Chip
                                  icon={<People sx={{ fontSize: '0.8rem' }} />}
                                  label={getCollaboratorCount(note)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(note.updatedAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => navigate(`/note/${selectedNoteId}`)}>
          {t('notes.edit')}
        </MenuItem>
        <MenuItem onClick={handleCreateChildNote}>
          {t('notes.hierarchy.createChildNote')}
        </MenuItem>
        <MenuItem onClick={handleSetParentNote}>
          {t('notes.hierarchy.setParentNote')}
        </MenuItem>
        <MenuItem onClick={handleSetChildNote}>
          {t('notes.hierarchy.setChildNote')}
        </MenuItem>
        <MenuItem onClick={handleArchiveNote}>
          {t('notes.archive')}
        </MenuItem>
        <MenuItem onClick={handleDeleteNote} sx={{ color: 'error.main' }}>
          {t('notes.delete')}
        </MenuItem>
      </Menu>

      {loading && <LoadingSpinner />}
    </Box>
  );
};

export default DashboardPage;