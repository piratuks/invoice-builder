import { Print } from '@mui/icons-material';
import { Box, Button, Grid, Paper, TextField, Typography } from '@mui/material';
import { type FC, useState } from 'react';
import { useClientsRetrieve } from '../../shared/hooks/clients/useClientsRetrieve';

export const MailingLabelsPage: FC = () => {
  const { clients } = useClientsRetrieve({ immediate: true });
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
          label="Top Margin"
          type="number"
          value={topMargin}
          onChange={(e) => setTopMargin(Number(e.target.value))}
          size="small"
          sx={{ width: 100, mr: 1 }}
        />
        <TextField
          label="Left Margin"
          type="number"
          value={leftMargin}
          onChange={(e) => setLeftMargin(Number(e.target.value))}
          size="small"
          sx={{ width: 100, mr: 1 }}
        />
        <TextField
          label="Row Spacing"
          type="number"
          value={rowSpacing}
          onChange={(e) => setRowSpacing(Number(e.target.value))}
          size="small"
          sx={{ width: 100, mr: 1 }}
        />
        <TextField
          label="Column Spacing"
          type="number"
          value={colSpacing}
          onChange={(e) => setColSpacing(Number(e.target.value))}
          size="small"
          sx={{ width: 100 }}
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
                height: 100,
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