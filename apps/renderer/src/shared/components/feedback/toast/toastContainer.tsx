import { Box } from '@mui/material';
import type { FC } from 'react';
import React from 'react';
import type { ToastMeta } from '../../../types/toastMeta';
import { Toast } from './toast';

interface Props {
  toasts: ToastMeta[];
  onClose?: (id: string) => void;
}

const TOAST_SPACING = 72;

export const ToastContainer: FC<Props> = React.memo(({ toasts, onClose = () => {} }) => {
  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1400
        }}
      >
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            message={toast.message}
            severity={toast.severity}
            vertical={toast.vertical}
            horizontal={toast.horizontal}
            variant={toast.variant}
            autoHideDuration={toast.autoHideDuration}
            onClose={() => onClose(toast.id)}
            offset={index * TOAST_SPACING}
          />
        ))}
      </Box>
    </>
  );
});
