import { Print } from '@mui/icons-material';
import { Box, Button, Grid, Paper, TextField, Typography } from '@mui/material';
import { type FC, useState } from 'react';
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

export const MailingLabelsPage: FC = () => {
  const { clients } = useClientsRetrieve({ immediate: true });
  const [tagWidth, setTagWidth] = useState(200);
  const [tagHeight, setTagHeight] = useState(50);
  const [topMargin, setTopMargin] = useState(0);
  const [leftMargin, setLeftMargin] = useState(0);
  const [rowSpacing, setRowSpacing] = useState(1);
  const [colSpacing, setColSpacing] = useState(1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: 2,
        backgroundColor: 'white',
        '@media print': { p: 0 }
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 2, displayPrint: 'none' }}>
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
      <Grid
        container
        rowSpacing={rowSpacing}
        columnSpacing={colSpacing}
        sx={{
          mt: topMargin,
          ml: leftMargin,
          '@media print': { mt: topMargin, ml: leftMargin }
        }}
      >
        {Array.isArray(clients) && clients.map((client, index) => (
          <Grid item xs={4} key={client.id || index} sx={{ '@media print': { pageBreakInside: 'avoid' } }}>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                width: tagWidth,
                height: tagHeight,
                border: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                '@media print': {
                  border: '1px solid black',
                  height: 'auto',
                  minHeight: 80,
                  pageBreakInside: 'avoid'
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
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};