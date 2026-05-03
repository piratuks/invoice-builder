import { Print } from '@mui/icons-material';
import { Box, Button, Grid, Paper, TextField, Typography } from '@mui/material';
import { type FC, useEffect, useState } from 'react';
import { useClientsRetrieve } from '../../shared/hooks/clients/useClientsRetrieve';

const textFieldSx = {
  width: 100,
  '& .MuiOutlinedInput-root': {
    color: 'black',
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.5)'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.8)'
    },
    '&.Mui-focused fieldset': {
      borderColor: 'primary.main'
    }
  },
  '& .MuiInputLabel-root': {
    color: 'black'
  }
};

interface MailingLabelsSettings {
  tagWidth: number;
  tagHeight: number;
  topMargin: number;
  leftMargin: number;
  rowSpacing: number;
  colSpacing: number;
}

const STORAGE_KEY = 'mailingLabelsSettings';

const defaultSettings: MailingLabelsSettings = {
  tagWidth: 200,
  tagHeight: 50,
  topMargin: 0,
  leftMargin: 0,
  rowSpacing: 1,
  colSpacing: 1
};

export const MailingLabelsPage: FC = () => {
  const { clients } = useClientsRetrieve({ immediate: true });
  const [tagWidth, setTagWidth] = useState(defaultSettings.tagWidth);
  const [tagHeight, setTagHeight] = useState(defaultSettings.tagHeight);
  const [topMargin, setTopMargin] = useState(defaultSettings.topMargin);
  const [leftMargin, setLeftMargin] = useState(defaultSettings.leftMargin);
  const [rowSpacing, setRowSpacing] = useState(defaultSettings.rowSpacing);
  const [colSpacing, setColSpacing] = useState(defaultSettings.colSpacing);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings: MailingLabelsSettings = JSON.parse(saved);
        setTagWidth(settings.tagWidth);
        setTagHeight(settings.tagHeight);
        setTopMargin(settings.topMargin);
        setLeftMargin(settings.leftMargin);
        setRowSpacing(settings.rowSpacing);
        setColSpacing(settings.colSpacing);
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings: MailingLabelsSettings = {
      tagWidth,
      tagHeight,
      topMargin,
      leftMargin,
      rowSpacing,
      colSpacing
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [tagWidth, tagHeight, topMargin, leftMargin, rowSpacing, colSpacing]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'white',
        '@media print': {
          minHeight: 'auto',
          backgroundColor: 'white',
          margin: 0,
          padding: 0
        }
      }}
    >
      {/* Control Panel - Hidden from print */}
      <Box
        sx={{
          display: 'block',
          textAlign: 'center',
          p: 2,
          backgroundColor: 'white',
          borderBottom: '1px solid #eee',
          '@media print': {
            display: 'none'
          }
        }}
      >
        <Button
          variant="contained"
          startIcon={<Print />}
          onClick={handlePrint}
          sx={{ mr: 2 }}
        >
          Print Labels
        </Button>
        <TextField
          label="Width"
          type="number"
          value={tagWidth}
          onChange={(e) => setTagWidth(Number(e.target.value))}
          size="small"
          sx={textFieldSx}
        />
        <TextField
          label="Height"
          type="number"
          value={tagHeight}
          onChange={(e) => setTagHeight(Number(e.target.value))}
          size="small"
          sx={textFieldSx}
        />
        <TextField
          label="Top Margin"
          type="number"
          value={topMargin}
          onChange={(e) => setTopMargin(Number(e.target.value))}
          size="small"
          sx={textFieldSx}
        />
        <TextField
          label="Left Margin"
          type="number"
          value={leftMargin}
          onChange={(e) => setLeftMargin(Number(e.target.value))}
          size="small"
          sx={textFieldSx}
        />
        <TextField
          label="Row Spacing"
          type="number"
          value={rowSpacing}
          onChange={(e) => setRowSpacing(Number(e.target.value))}
          size="small"
          sx={textFieldSx}
        />
        <TextField
          label="Column Spacing"
          type="number"
          value={colSpacing}
          onChange={(e) => setColSpacing(Number(e.target.value))}
          size="small"
          sx={textFieldSx}
        />
      </Box>

      {/* Print Preview Container - A4 Paper */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          p: 2,
          backgroundColor: '#f5f5f5',
          '@media print': {
            display: 'block',
            p: 0,
            backgroundColor: 'white'
          }
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: '210mm',
            height: '297mm',
            backgroundColor: 'white',
            position: 'relative',
            '@media print': {
              width: '210mm',
              height: '297mm',
              boxShadow: 'none',
              elevation: 0
            }
          }}
        >
          <Grid
            container
            sx={{
              p: `${topMargin}px 0 0 ${leftMargin}px`,
              rowGap: `${rowSpacing}px`,
              columnGap: `${colSpacing}px`,
              '@media print': {
                p: `${topMargin}px 0 0 ${leftMargin}px`,
                rowGap: `${rowSpacing}px`,
                columnGap: `${colSpacing}px`
              }
            }}
          >
            {Array.isArray(clients) && clients.map((client, index) => (
              <Grid item xs={4} key={client.id || index}>
                <Box
                  sx={{
                    width: tagWidth,
                    height: tagHeight,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    p: 1,
                    color: 'black',
                    '@media print': {
                      width: tagWidth,
                      height: tagHeight,
                      p: 1,
                      color: 'black'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {client.name}
                  </Typography>
                  {client.address && (
                    <Typography variant="body2">{client.address}</Typography>
                  )}
                  {client.additional && (
                    <Typography variant="body2">{client.additional}</Typography>
                  )}
                  {client.countryCode && (
                    <Typography variant="body2">{client.countryCode}</Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};