import ClearIcon from '@mui/icons-material/Clear';
import { Box, IconButton, ListItemButton, ListItemText, Typography } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  name?: string;
  onEdit: () => void;
  onClear?: () => void;
}

const BankSelectorComponent: FC<Props> = ({ name, onEdit, onClear }) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ width: 'fit-content' }}>
      <ListItemButton onClick={onEdit} sx={{ pt: 2, pb: 2, pl: 2, pr: 1.5, borderRadius: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'start',
            alignItems: 'center',
            width: '100%',
            gap: 1
          }}
        >
          <ListItemText
            primary={
              <Typography
                component="div"
                variant="body1"
                sx={{ fontWeight: 600, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {t('common.bank').toUpperCase()}
              </Typography>
            }
            secondary={
              name && (
                <Typography
                  component="div"
                  variant="body2"
                  sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {name}
                </Typography>
              )
            }
            disableTypography
            sx={{ m: 0 }}
            slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
          />
          {name && onClear && (
            <IconButton
              edge="end"
              size="small"
              aria-label={t('common.clear')}
              onClick={event => {
                event.stopPropagation();
                onClear();
              }}
              sx={{ ml: 'auto' }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </ListItemButton>
    </Box>
  );
};
export const BankSelector = memo(BankSelectorComponent);
