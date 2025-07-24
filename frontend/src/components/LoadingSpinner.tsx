import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Chargement...',
  size = 40,
  fullScreen = true
}) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        display=\"flex\"
        flexDirection=\"column\"
        alignItems=\"center\"
        justifyContent=\"center\"
        gap={2}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <CircularProgress
            size={size}
            thickness={4}
            sx={{
              color: 'primary.main',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
        </motion.div>
        
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Typography
              variant=\"body2\"
              color=\"text.secondary\"
              textAlign=\"center\"
              sx={{ fontWeight: 500 }}
            >
              {message}
            </Typography>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <Box
        position=\"fixed\"
        top={0}
        left={0}
        width=\"100vw\"
        height=\"100vh\"
        display=\"flex\"
        alignItems=\"center\"
        justifyContent=\"center\"
        bgcolor=\"rgba(255, 255, 255, 0.9)\"
        zIndex={9999}
        sx={{
          backdropFilter: 'blur(4px)',
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingSpinner;