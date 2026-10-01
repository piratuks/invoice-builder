import { Box, ListItemButton, ListItemText, Typography } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  clientName?: string;
  isRequired?: boolean;
  onEdit: () => void;
}

const ClientSelectorComponent: FC<Props> = ({ clientName, onEdit, isRequired = true }) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ width: 'fit-content' }}>
      <ListItemButton
        onClick={onEdit}
        sx={{
          pt: 2,
          pb: 2,
          pl: 2,
          pr: 2,
          width: '100%',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'start',
          flexDirection: 'column'
        }}
      >
        <ListItemText
          primary={
            <Typography
              component="div"
              variant="body1"
              sx={{ fontWeight: 600, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {t('invoices.billTo').toUpperCase()} {isRequired ? '*' : ''}
            </Typography>
          }
          secondary={
            <Typography
              component="div"
              variant="body2"
              sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {clientName}
            </Typography>
          }
          disableTypography
          sx={{ m: 0 }}
          slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
        />
      </ListItemButton>
    </Box>
  );
};
export const ClientSelector = memo(ClientSelectorComponent);
