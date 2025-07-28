import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  Badge,
  Box,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Notifications,
  Close,
  CheckCircle,
  Error,
  Warning,
  Info,
  MarkEmailRead,
  Delete,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/api';
import { Notification } from '../types';
import { toastService } from './NotificationToast';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications(1, 50, false);
      
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.pagination.unreadCount);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toastService.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId?: string) => {
    try {
      await apiService.markNotificationsAsRead(
        notificationId ? [notificationId] : undefined,
        !notificationId
      );
      
      // Atualizar estado local
      if (notificationId) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isLue: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(notif => ({ ...notif, isLue: true })));
        setUnreadCount(0);
      }
      
      toastService.success('Notificação marcada como lida');
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      toastService.error('Erro ao marcar notificação como lida');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'partage':
        return <CheckCircle color="success" />;
      case 'modification':
        return <Info color="info" />;
      case 'commentaire':
        return <Info color="info" />;
      case 'invitation':
        return <Warning color="warning" />;
      case 'systeme':
        return <Info color="info" />;
      default:
        return <Info color="info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'partage':
        return 'success';
      case 'modification':
        return 'info';
      case 'commentaire':
        return 'info';
      case 'invitation':
        return 'warning';
      case 'systeme':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 400,
          maxWidth: '90vw',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h2">
            Notificações
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        
        {unreadCount > 0 && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip 
              label={`${unreadCount} não lidas`} 
              color="primary" 
              size="small" 
            />
            <Button
              size="small"
              startIcon={<MarkEmailRead />}
              onClick={() => markAsRead()}
            >
              Marcar todas como lidas
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma notificação
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Você não tem notificações no momento
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: notification.isLue ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'background.paper' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: notification.isLue ? 400 : 600,
                              color: notification.isLue ? 'text.primary' : 'text.primary',
                            }}
                          >
                            {notification.message}
                          </Typography>
                          {!notification.isLue && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(notification.createdAt)}
                          </Typography>
                          <Chip
                            label={notification.type}
                            size="small"
                            color={getNotificationColor(notification.type) as any}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                    />
                    
                    {!notification.isLue && (
                      <IconButton
                        size="small"
                        onClick={() => markAsRead(notification._id)}
                        sx={{ ml: 1 }}
                      >
                        <MarkEmailRead fontSize="small" />
                      </IconButton>
                    )}
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationsPanel; 