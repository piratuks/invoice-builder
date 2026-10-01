import { Box, ListItemButton, ListItemText, Typography, useTheme } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  data?: {
    currencyCode?: string;
    currencySymbol?: string;
  };
  isRequired?: boolean;
  onEdit: () => void;
}

const CurrencySelectorComponent: FC<Props> = ({ data, onEdit, isRequired = true }) => {
  const { currencyCode, currencySymbol } = data ?? {};

  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box sx={{ width: 'fit-content' }}>
      <ListItemButton onClick={onEdit} sx={{ pt: 2, pb: 2, pl: 2, pr: 2, borderRadius: 1 }}>
        <ListItemText
          primary={
            <Typography
              component="div"
              variant="body1"
              sx={{ fontWeight: 600, color: theme.palette.primary.main, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {t('common.currency').toUpperCase()} {isRequired ? '*' : ''}
            </Typography>
          }
          secondary={
            currencyCode &&
            currencySymbol && (
              <Typography
                component="div"
                variant="body2"
                sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {currencyCode}&nbsp;/&nbsp;
                {currencySymbol}
              </Typography>
            )
          }
          disableTypography
          sx={{ m: 0 }}
          slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
        />
      </ListItemButton>
    </Box>
  );
};
export const CurrencySelector = memo(CurrencySelectorComponent);
