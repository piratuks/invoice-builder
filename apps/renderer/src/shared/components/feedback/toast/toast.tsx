import { Alert, Snackbar } from '@mui/material';
import React, { useState, type FC } from 'react';
import type { ToastProps } from '../../../types/toastProps';

export const Toast: FC<ToastProps> = React.memo(
  ({
    message,
    severity,
    vertical = 'top',
    horizontal = 'center',
    variant = 'filled',
    autoHideDuration = 3000,
    offset = 0,
    onClose = () => {}
  }) => {
    const [open, setOpen] = useState(true);
    const handleClose = (_: unknown, reason?: string) => {
      if (reason === 'clickaway') return;
      setOpen(false);
      onClose();
    };

    return (
      <Snackbar
        sx={{
          transform: vertical === 'top' ? `translateY(${offset}px)` : `translateY(-${offset}px)`,
          transition: 'transform 0.3s ease'
        }}
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: vertical, horizontal: horizontal }}
      >
        <Alert variant={variant} onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    );
  }
);
