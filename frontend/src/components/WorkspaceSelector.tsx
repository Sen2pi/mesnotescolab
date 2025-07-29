import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Folder,
  Public,
  Lock,
  Search,
  Add,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/api';
import { Workspace } from '../types';
import { toastService } from './NotificationToast';

interface WorkspaceSelectorProps {
  open: boolean;
  onClose: () => void;
  onWorkspaceSelected: (workspace: Workspace) => void;
  currentWorkspaceId?: string;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  open,
  onClose,
  onWorkspaceSelected,
  currentWorkspaceId,
}) => {
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (open) {
      loadWorkspaces();
    }
  }, [open]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWorkspaces();
      
      if (response.success && response.data) {
        setWorkspaces(response.data);
        
        // Se há um workspace atual, selecioná-lo
        if (currentWorkspaceId) {
          const currentWorkspace = response.data.find(w => w._id === currentWorkspaceId);
          if (currentWorkspace) {
            setSelectedWorkspace(currentWorkspace);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
      toastService.error('Erro ao carregar workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
  };

  const handleConfirm = () => {
    if (selectedWorkspace) {
      onWorkspaceSelected(selectedWorkspace);
      onClose();
    }
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '50vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6">Selecionar Workspace</Typography>
        <Typography variant="body2" color="text.secondary">
          Escolha um workspace para criar sua nota
        </Typography>
      </DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          placeholder="Pesquisar workspaces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredWorkspaces.length === 0 ? (
          <Alert severity="info">
            Nenhum workspace encontrado. Crie um workspace primeiro!
          </Alert>
        ) : (
          <List>
            <AnimatePresence>
              {filteredWorkspaces.map((workspace, index) => (
                <motion.div
                  key={workspace._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleWorkspaceSelect(workspace)}
                      selected={selectedWorkspace?._id === workspace._id}
                      sx={{
                        border: '1px solid',
                        borderColor: selectedWorkspace?._id === workspace._id 
                          ? 'primary.main' 
                          : 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                    <ListItemIcon>
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
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {workspace.nom}
                          </Typography>
                          {workspace.isPublic ? (
                            <Chip 
                              icon={<Public />} 
                              label="Público" 
                              size="small" 
                              color="success" 
                            />
                          ) : (
                            <Chip 
                              icon={<Lock />} 
                              label="Privado" 
                              size="small" 
                              color="default" 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {workspace.description || 'Sem descrição'}
                        </Typography>
                      }
                    />
                                      </ListItemButton>
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selectedWorkspace}
        >
          Selecionar Workspace
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkspaceSelector; 