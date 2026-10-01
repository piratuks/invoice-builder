import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Box, Tab, Tabs, Tooltip, useTheme } from '@mui/material';
import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { TabPanel } from '../../shared/components/layout/tabPanel/TabPanel';
import { a11yProps } from '../../shared/utils/generalFunctions';
import { LocalDatabase } from './LocalDatabase';
import { ServerDatabase } from './ServerDatabase';

interface Props {
  onDatabaseRead?: () => void;
}
export const DatabaseChooser: FC<Props> = ({ onDatabaseRead }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [value, setValue] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={value} onChange={handleChange}>
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {t('databaseChooser.local')}

              <Tooltip title={t('databaseChooser.localDesc')} arrow>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: theme.palette.text.secondary
                  }}
                  aria-label={`${t('databaseChooser.local')}`}
                >
                  <HelpOutlineIcon fontSize="small" />
                </Box>
              </Tooltip>
            </Box>
          }
          {...a11yProps(0)}
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {t('databaseChooser.server')}

              <Tooltip title={t('databaseChooser.serverDesc')} arrow>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: theme.palette.text.secondary
                  }}
                  aria-label={`${t('databaseChooser.server')}`}
                >
                  <HelpOutlineIcon fontSize="small" />
                </Box>
              </Tooltip>
            </Box>
          }
          {...a11yProps(1)}
        />
      </Tabs>

      <TabPanel value={value} index={0}>
        {<LocalDatabase onDatabaseRead={onDatabaseRead} />}
      </TabPanel>

      <TabPanel value={value} index={1}>
        {<ServerDatabase onDatabaseRead={onDatabaseRead} />}
      </TabPanel>
    </Box>
  );
};
