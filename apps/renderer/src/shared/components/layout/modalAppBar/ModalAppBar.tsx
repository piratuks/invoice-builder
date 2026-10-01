import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { type FC, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  formData?: unknown;
  description?: string;
  isFormValid: boolean;
  isSaving?: boolean;
  onClose?: () => void;
  onSave?: (data: unknown) => void;
  renderCustomButtons?: () => ReactNode;
}
export const ModalAppBar: FC<Props> = ({
  title,
  formData,
  description,
  isFormValid,
  isSaving = false,
  onClose = () => {},
  onSave = () => {},
  renderCustomButtons = () => null
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <AppBar sx={{ position: 'relative', borderRadius: '0' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tooltip title={t('ariaLabel.back')}>
          <IconButton
            onClick={onClose}
            aria-label={t('ariaLabel.back')}
            sx={{
              color: theme.palette.secondary.main
            }}
          >
            <ArrowBackIcon fontSize="medium" />
          </IconButton>
        </Tooltip>

        {title && (
          <Typography variant="h5" component="div">
            {title}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {renderCustomButtons()}
          <Tooltip
            title={!isFormValid && description ? description : ''}
            disableHoverListener={isFormValid}
            disableFocusListener={isFormValid}
            disableTouchListener={isFormValid}
          >
            <Box>
              <Button
                autoFocus
                color="inherit"
                onClick={() => {
                  if (formData !== undefined) onSave(formData);
                }}
                disabled={!isFormValid || isSaving}
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {t('common.save')}
              </Button>
            </Box>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
