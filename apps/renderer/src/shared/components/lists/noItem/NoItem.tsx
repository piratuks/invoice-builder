import GridView from '@mui/icons-material/GridView';
import { Box, Typography } from '@mui/material';
import type { FC } from 'react';

interface Props {
  text: string;
  node?: React.ReactNode;
  icon?: React.ReactNode;
}

export const NoItem: FC<Props> = ({ text, node, icon = <GridView color="action" fontSize="large" /> }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        flexDirection: 'column',
        gap: 2
      }}
    >
      {icon}
      <Typography variant="h5">{text}</Typography>
      {node}
    </Box>
  );
};
