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
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  Folder,
  FolderOpen,
  Public,
  Lock,
  ColorLens,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/api';
import { Workspace, CreateWorkspaceFormData } from '../types';
import { toastService } from './NotificationToast';

interface WorkspaceManagerProps {
  open: boolean;
  onClose: () => void;
  onWorkspaceCreated?: (workspace: Workspace) => void;
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ 
  open, 
  onClose, 
  onWorkspaceCreated 
}) => {
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  
  const [formData, setFormData] = useState<CreateWorkspaceFormData>({
    nom: '',
    description: '',
    parent: '',
    couleur: '#667eea',
    isPublic: false,
  });

  useEffect(() => {
    if (open) {
      loadWorkspaces();
    }
  }, [open]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWorkspaceHierarchy();
      
      if (response.success && response.data) {
        setWorkspaces(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
      toastService.error('Erro ao carregar workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingWorkspace) {
        const response = await apiService.updateWorkspace(editingWorkspace._id, formData);
        if (response.success && response.data) {
          toastService.success('Workspace atualizado com sucesso');
          setWorkspaces(prev => 
            prev.map(w => w._id === editingWorkspace._id ? response.data! : w)
          );
        }
      } else {
        const response = await apiService.createWorkspace(formData);
        if (response.success && response.data) {
          toastService.success('Workspace criado com sucesso');
          setWorkspaces(prev => [...prev, response.data!]);
          onWorkspaceCreated?.(response.data);
        }
      }
      
      handleCloseForm();
    } catch (error) {
      console.error('Erro ao salvar workspace:', error);
      toastService.error('Erro ao salvar workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este workspace?')) return;
    
    try {
      await apiService.deleteWorkspace(workspaceId);
      toastService.success('Workspace excluído com sucesso');
      setWorkspaces(prev => prev.filter(w => w._id !== workspaceId));
    } catch (error) {
      console.error('Erro ao excluir workspace:', error);
      toastService.error('Erro ao excluir workspace');
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingWorkspace(null);
    setFormData({
      nom: '',
      description: '',
      parent: '',
      couleur: '#667eea',
      isPublic: false,
    });
  };

  const handleEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setFormData({
      nom: workspace.nom,
      description: workspace.description || '',
      parent: workspace.parent?._id || '',
      couleur: workspace.couleur,
      isPublic: workspace.isPublic,
    });
    setShowCreateForm(true);
  };

  const toggleWorkspaceExpansion = (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces);
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId);
    } else {
      newExpanded.add(workspaceId);
    }
    setExpandedWorkspaces(newExpanded);
  };

  const renderWorkspaceTree = (workspaceList: Workspace[], level = 0) => {
    return workspaceList.map(workspace => {
      const hasChildren = workspace.enfants && workspace.enfants.length > 0;
      const isExpanded = expandedWorkspaces.has(workspace._id);
      
      return (
        <motion.div
          key={workspace._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: level * 0.1 }}
        >
          <ListItem
            sx={{
              pl: level * 3 + 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>
              {hasChildren ? (
                <IconButton
                  size="small"
                  onClick={() => toggleWorkspaceExpansion(workspace._id)}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              ) : (
                <Folder sx={{ color: workspace.couleur }} />
              )}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {workspace.nom}
                  </Typography>
                  {workspace.isPublic ? (
                    <Chip icon={<Public />} label="Público" size="small" color="success" />
                  ) : (
                    <Chip icon={<Lock />} label="Privado" size="small" color="default" />
                  )}
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: workspace.couleur,
                      border: '2px solid',
                      borderColor: 'background.paper',
                    }}
                  />
                </Box>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {workspace.description || 'Sem descrição'}
                </Typography>
              }
            />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleEditWorkspace(workspace)}
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDeleteWorkspace(workspace._id)}
                color="error"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </ListItem>
          
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderWorkspaceTree(workspace.enfants!, level + 1)}
              </List>
            </Collapse>
          )}
        </motion.div>
      );
    });
  };

  const colorOptions = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#a8edea', '#fed6e3',
    '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef', '#fecfef', '#a18cd1',
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Gerenciar Workspaces</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
          >
            Novo Workspace
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {showCreateForm ? (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Nome do Workspace"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  required
                />
              </Grid>
              
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Workspace Pai</InputLabel>
                  <Select
                    value={formData.parent}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent: e.target.value }))}
                    label="Workspace Pai"
                  >
                    <MenuItem value="">Nenhum (Workspace Raiz)</MenuItem>
                    {workspaces.map(workspace => (
                      <MenuItem key={workspace._id} value={workspace._id}>
                        {workspace.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    />
                  }
                  label="Workspace Público"
                />
              </Grid>
              
              <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Cor do Workspace
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {colorOptions.map(color => (
                    <Box
                      key={color}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.couleur === color ? '3px solid' : '2px solid',
                        borderColor: formData.couleur === color ? 'primary.main' : 'transparent',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, couleur: color }))}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : workspaces.length === 0 ? (
              <Alert severity="info">
                Nenhum workspace encontrado. Crie seu primeiro workspace!
              </Alert>
            ) : (
              <List>
                {renderWorkspaceTree(workspaces)}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {showCreateForm && (
          <>
            <Button onClick={handleCloseForm}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !formData.nom}
            >
              {editingWorkspace ? 'Atualizar' : 'Criar'}
            </Button>
          </>
        )}
        {!showCreateForm && (
          <Button onClick={onClose}>
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WorkspaceManager; 