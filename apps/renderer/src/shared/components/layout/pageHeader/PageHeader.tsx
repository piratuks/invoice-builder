import { CloseOutlined } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  showBack: boolean;
  showSave?: boolean;
  showClose?: boolean;
  showCustom?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onSave?: (data: unknown) => void;
  formData?: unknown;
  description?: string;
  isFormValid?: boolean;
  renderCustomButtons?: () => ReactNode;
}
export const PageHeader: FC<Props> = ({
  title,
  showBack = false,
  showClose = false,
  showCustom = true,
  isFormValid,
  formData,
  showSave,
  description,
  onBack = () => {},
  onSave = () => {},
  onClose = () => {},
  renderCustomButtons = () => null
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showBack && (
        <Tooltip title={t('ariaLabel.back')}>
          <IconButton onClick={onBack} aria-label={t('ariaLabel.back')} sx={{ color: theme.palette.secondary.main }}>
            <ArrowBackIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
      )}

      {title && (
        <Typography variant="h5" noWrap component="div" sx={{ color: theme.palette.secondary.main }}>
          {title}
        </Typography>
      )}

      <Box sx={{ flexGrow: 1 }} />

      {showCustom && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{renderCustomButtons()}</Box>}

      {showSave && (
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
              disabled={!isFormValid}
            >
              {t('common.save')}
            </Button>
          </Box>
        </Tooltip>
      )}

      {showClose && (
        <Tooltip title={t('ariaLabel.back')}>
          <IconButton onClick={onClose} aria-label={t('ariaLabel.back')} sx={{ color: theme.palette.secondary.main }}>
            <CloseOutlined fontSize="medium" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
