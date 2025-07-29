import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

const languages = [
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];

const LanguageSelector: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, isLoading } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode !== currentLanguage) {
      await changeLanguage(languageCode);
    }
    handleClose();
  };

  const currentLanguageData = languages.find(lang => lang.code === currentLanguage);

  return (
    <>
      <Tooltip title={t('common.language')}>
        <IconButton
          onClick={handleClick}
          disabled={isLoading}
          sx={{
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {currentLanguageData ? (
            <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
              {currentLanguageData.flag}
            </Typography>
          ) : (
            <LanguageIcon />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1,
            '& .MuiMenuItem-root': {
              py: 1.5,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('common.language')}
          </Typography>
        </Box>

        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === currentLanguage}
            disabled={isLoading}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                {language.flag}
              </Typography>
            </ListItemIcon>
            
            <ListItemText
              primary={language.name}
              secondary={t(`languages.${language.code}`)}
            />
            
            {language.code === currentLanguage && (
              <CheckIcon sx={{ ml: 1, color: 'inherit' }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector; 