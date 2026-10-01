import { Box } from '@mui/material';
import type { FC } from 'react';

interface Props {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabPanel: FC<Props> = ({ children, index, value }) => {
  return (
    <Box role="tabpanel" hidden={value !== index} id={`mui-tabpanel-${index}`} aria-labelledby={`mui-tab-${index}`}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </Box>
  );
};
