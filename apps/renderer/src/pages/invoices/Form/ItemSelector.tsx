import AddIcon from '@mui/icons-material/Add';
import { Box, ListItemButton, ListItemText, Typography, useTheme } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onEdit: () => void;
}
const ItemSelectorComponent: FC<Props> = ({ onEdit }) => {
  const { t } = useTranslation();
  const theme = useTheme();

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
            <>
              <Typography
                component="div"
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'row'
                }}
              >
                <AddIcon />
                {t('invoices.addItem').toUpperCase()} *
              </Typography>
            </>
          }
          disableTypography
          sx={{ m: 0 }}
          slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
        />
      </ListItemButton>
    </Box>
  );
};
export const ItemSelector = memo(ItemSelectorComponent);
