import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, Slide } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService } from '../services/socket';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

class ToastService {
  private listeners: ((message: ToastMessage) => void)[] = [];

  subscribe(callback: (message: ToastMessage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notify(message: ToastMessage) {
    this.listeners.forEach(callback => callback(message));
  }

  success(message: string, title?: string, duration = 4000) {
    this.notify({
      id: Date.now().toString(),
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(message: string, title?: string, duration = 6000) {
    this.notify({
      id: Date.now().toString(),
      type: 'error',
      title,
      message,
      duration
    });
  }

  warning(message: string, title?: string, duration = 5000) {
    this.notify({
      id: Date.now().toString(),
      type: 'warning',
      title,
      message,
      duration
    });
  }

  info(message: string, title?: string, duration = 4000) {
    this.notify({
      id: Date.now().toString(),
      type: 'info',
      title,
      message,
      duration
    });
  }
}

export const toastService = new ToastService();

const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Referência para o áudio
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const unsubscribe = toastService.subscribe((newToast) => {
      setToasts(prev => [...prev, newToast]);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      // Auto-remove après la durée spécifiée
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
      }, newToast.duration);
    });

    // Listener para notificações em tempo real
    const handleSocketNotification = (notification: any) => {
      toastService.info(notification.message || 'Nouvelle notification', 'Notification');
    };
    socketService.on('notification', handleSocketNotification);

    return () => {
      unsubscribe();
      socketService.off('notification', handleSocketNotification);
    };
  }, []);

  const handleClose = (toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000 }}>
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              y: index * 80
            }}
            exit={{ 
              opacity: 0, 
              x: 300, 
              scale: 0.8,
              transition: { duration: 0.2 }
            }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              minWidth: 320,
              maxWidth: 400,
            }}
          >
            <Snackbar
              open={true}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              sx={{ position: 'static' }}
            >
              <Alert
                severity={toast.type}
                onClose={() => handleClose(toast.id)}
                variant="filled"
                sx={{
                  minWidth: 320,
                  maxWidth: 400,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '& .MuiAlert-icon': {
                    fontSize: '1.2rem',
                  },
                  '& .MuiAlert-message': {
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  },
                }}
              >
                {toast.title && (
                  <AlertTitle sx={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 600,
                    marginBottom: 0.5 
                  }}>
                    {toast.title}
                  </AlertTitle>
                )}
                {toast.message}
              </Alert>
            </Snackbar>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;