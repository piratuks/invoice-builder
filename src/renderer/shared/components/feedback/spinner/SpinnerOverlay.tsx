import { Box, CircularProgress, useTheme } from '@mui/material';
import type { FC } from 'react';
import React from 'react';

export const SpinnerOverlay: FC = React.memo(() => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: theme.palette.grey[100],
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1500
      }}
    >
      <CircularProgress size={48} />
    </Box>
  );
});
