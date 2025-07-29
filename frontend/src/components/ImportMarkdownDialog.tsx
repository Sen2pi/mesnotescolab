import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  CloudUpload,
  Close,
  Description
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ImportMarkdownDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (content: string, filename: string) => void;
}

const ImportMarkdownDialog: React.FC<ImportMarkdownDialogProps> = ({
  open,
  onClose,
  onImport
}) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      return;
    }

    // Validar tipo de arquivo
    if (!file.name.toLowerCase().endsWith('.md')) {
      setError(t('notes.import.fileTypeError'));
      setSelectedFile(null);
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('notes.import.fileSizeError'));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const content = await selectedFile.text();
      onImport(content, selectedFile.name);
      handleClose();
    } catch (error) {
      setError(t('notes.import.importError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        input.files = event.dataTransfer.files;
        handleFileSelect({ target: { files: event.dataTransfer.files } } as any);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {t('notes.import.title')}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box
          sx={{
            border: '2px dashed',
            borderColor: selectedFile ? 'success.main' : 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {selectedFile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Description color="success" />
              <Typography variant="body1" color="success.main">
                {selectedFile.name}
              </Typography>
            </Box>
          ) : (
            <Box>
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t('notes.import.selectFile')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Arraste um arquivo .md aqui ou clique para selecionar
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!selectedFile || loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? t('common.loading') : t('common.import')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportMarkdownDialog; 