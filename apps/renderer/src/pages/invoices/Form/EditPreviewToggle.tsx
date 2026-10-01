import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceFormMode } from '../../../shared/enums/invoiceFormMode';

interface EditPreviewToggleProps {
  mode: InvoiceFormMode;
  setMode: (m: InvoiceFormMode) => void;
}

export const EditPreviewToggle: React.FC<EditPreviewToggleProps> = ({ mode, setMode }) => {
  const { t } = useTranslation();

  const handleMode = (_event: React.MouseEvent<HTMLElement>, newMode: InvoiceFormMode | null) => {
    if (newMode !== null) setMode(newMode);
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleMode}
        size="small"
        aria-label={t('ariaLabel.editPreview')}
        color="primary"
      >
        <ToggleButton value={InvoiceFormMode.edit} aria-label={t('ariaLabel.edit')} sx={{ minWidth: 70 }}>
          {t('ariaLabel.edit')}
        </ToggleButton>
        <ToggleButton value={InvoiceFormMode.preview} aria-label={t('ariaLabel.preview')} sx={{ minWidth: 70 }}>
          {t('ariaLabel.preview')}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
