import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import React, { useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../../../state/configureStore';
import { addToast } from '../../../../state/pageSlice';

interface Props {
  onImport?: (file: File) => Promise<void> | void;
  onExport?: () => void;
  onDownloadTemplate?: () => void;
  showOnlyExport: boolean;
}

export const ImportExportButton: React.FC<Props> = ({ onImport, onExport, onDownloadTemplate, showOnlyExport }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!showOnlyExport) setAnchorEl(event.currentTarget);
    else onExport?.();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (action?: () => void) => {
    handleClose();
    action?.();
  };

  const handleImportClick = () => {
    handleClose();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImport) {
      try {
        await onImport(file);
      } catch (error) {
        const message = error instanceof Error ? error.message : t('error.importFailed');
        dispatch(addToast({ message: message, severity: 'error' }));
      }
    }
    event.target.value = '';
  };

  return (
    <>
      <Button variant="text" onClick={handleClick}>
        {showOnlyExport ? t('common.export') : t('common.importExport')}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={handleImportClick}>
          <ListItemIcon>
            <FileUploadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.import')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleItemClick(onExport)}>
          <ListItemIcon>
            <FileDownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.export')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleItemClick(onDownloadTemplate)}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.downloadTemplate')}</ListItemText>
        </MenuItem>
      </Menu>

      <input
        title={`"`}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </>
  );
};
