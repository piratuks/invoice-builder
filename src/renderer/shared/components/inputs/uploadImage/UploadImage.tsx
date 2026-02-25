import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Fab, IconButton, Tooltip, useTheme } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import 'react-image-crop/dist/ReactCrop.css';
import { useAppDispatch } from '../../../../state/configureStore';
import { addToast } from '../../../../state/pageSlice';
import { toDataUrl } from '../../../utils/dataUrlFunctions';
import { CropModal } from '../../modals/cropModal/CropModal';

interface UploadSquareProps {
  onUpload?: (file?: Blob, filename?: string) => void;
  size?: number;
  maxSizeMB?: number;
  imgUrl?: string;
  alwaysShowAddIcon?: boolean;
  disableEdit?: boolean;
  disableClear?: boolean;
}
export const UploadImage: React.FC<UploadSquareProps> = ({
  onUpload,
  size = 120,
  maxSizeMB = 2,
  imgUrl,
  alwaysShowAddIcon,
  disableEdit,
  disableClear
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [originalFileName, setOriginalFileName] = useState<string | undefined>(undefined);
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | undefined>(imgUrl);

  const handleClick = () => {
    if (croppedImageUrl && disableEdit) return;

    inputRef.current?.click();
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOriginalFileName(file.name);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      event.target.value = '';
      dispatch(addToast({ message: t('error.fileTooLarge', { maxSizeMB: maxSizeMB }), severity: 'error' }));
    } else {
      const url = await toDataUrl(file);
      setImageSrc(url);
      setCropDialogOpen(true);
    }
  };
  useEffect(() => {
    setCroppedImageUrl(imgUrl);
  }, [imgUrl]);

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        onClick={handleClick}
        sx={{
          width: size,
          height: size,
          border: '2px dashed',
          borderColor: theme.palette.grey['400'],
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          backgroundColor: croppedImageUrl ? theme.palette.common.white : undefined,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.action.hover
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          title={t('common.selectImage')}
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        {!alwaysShowAddIcon && croppedImageUrl && !cropDialogOpen ? (
          <>
            <img
              src={croppedImageUrl}
              alt={t('ariaLabel.cropped')}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {!disableClear && (
              <Tooltip title={t('ariaLabel.clear')}>
                <Fab
                  color="primary"
                  size="small"
                  aria-label={t('ariaLabel.clear')}
                  onClick={e => {
                    e.stopPropagation();
                    setCroppedImageUrl(undefined);
                    if (inputRef.current) inputRef.current.value = '';
                    if (onUpload) onUpload(undefined);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    zIndex: 100,
                    right: 0,
                    height: 24,
                    width: 24,
                    minHeight: 'unset'
                  }}
                >
                  <CloseIcon fontSize="small" />
                </Fab>
              </Tooltip>
            )}
          </>
        ) : (
          <Tooltip title={t('ariaLabel.uploadImage')}>
            <IconButton color="primary" aria-label={t('ariaLabel.uploadImage')}>
              <AddIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <CropModal
        isOpen={cropDialogOpen}
        imageSrc={imageSrc}
        onClose={() => {
          setCropDialogOpen(false);
          if (inputRef.current) inputRef.current.value = '';
        }}
        onSave={(url: string, file: Blob) => {
          setCroppedImageUrl(url);
          if (onUpload) onUpload(file, originalFileName);
          setCropDialogOpen(false);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </Box>
  );
};
