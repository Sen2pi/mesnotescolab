import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Button,
  Badge,
  Box
} from '@mui/material';
import {
  ArrowBack,
  Save,
  MoreVert,
  Visibility,
  Edit as EditIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

interface NoteHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onBackClick: () => void;
  onSave: () => void;
  onMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
  onPreviewToggle: () => void;
  canEdit: boolean;
  showPreview: boolean;
  hasUnsavedChanges: boolean;
  saving: boolean;
}

const NoteHeader: React.FC<NoteHeaderProps> = ({
  title,
  onTitleChange,
  onBackClick,
  onSave,
  onMenuClick,
  onPreviewToggle,
  canEdit,
  showPreview,
  hasUnsavedChanges,
  saving
}) => {
  const { mode } = useTheme();

  return (
    <AppBar position="static" elevation={0} sx={{ 
      bgcolor: 'background.paper', 
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid',
      borderColor: 'divider'
    }}>
      <Toolbar>
        <IconButton onClick={onBackClick} sx={{ mr: 2 }}>
          <ArrowBack sx={{ color: 'text.primary' }} />
        </IconButton>
        
        {/* Logo */}
        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
          <img 
            src={mode === 'dark' ? '/logoDark.png' : '/logoLight.png'} 
            alt="MesNotes Logo" 
            style={{ 
              height: '24px', 
              width: 'auto',
              maxWidth: '90px'
            }} 
          />
        </Box>
        
        <TextField
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          variant="standard"
          placeholder="Titre de la note"
          disabled={!canEdit}
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

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {canEdit && (
            <Button
              variant={showPreview ? 'outlined' : 'contained'}
              onClick={onPreviewToggle}
              startIcon={showPreview ? <EditIcon /> : <Visibility />}
              size="small"
              sx={{
                bgcolor: showPreview ? 'transparent' : 'primary.main',
                color: showPreview ? 'text.primary' : 'primary.contrastText',
                '&:hover': {
                  bgcolor: showPreview ? 'action.hover' : 'primary.dark'
                }
              }}
            >
              {showPreview ? 'Éditer' : 'Aperçu'}
            </Button>
          )}
          
          {canEdit && (
            <Badge variant="dot" color="warning" invisible={!hasUnsavedChanges}>
              <Button
                variant="contained"
                onClick={onSave}
                disabled={saving}
                startIcon={<Save />}
                size="small"
                sx={{
                  bgcolor: 'success.main',
                  color: 'success.contrastText',
                  '&:hover': {
                    bgcolor: 'success.dark'
                  }
                }}
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </Badge>
          )}

          <IconButton 
            onClick={onMenuClick}
            sx={{ color: 'text.primary' }}
          >
            <MoreVert />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NoteHeader; 