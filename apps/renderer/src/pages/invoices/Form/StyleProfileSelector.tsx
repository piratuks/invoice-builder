import { Box, ListItemButton, ListItemText, Typography, useTheme } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  name?: string;
  onEdit: () => void;
}

const StyleProfileSelectorComponent: FC<Props> = ({ name, onEdit }) => {
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
              {t('styleProfiles.title').toUpperCase()}
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
      </ListItemButton>
    </Box>
  );
};
export const StyleProfileSelector = memo(StyleProfileSelectorComponent);
