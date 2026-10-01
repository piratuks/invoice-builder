import { Box, Button } from '@mui/material';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import 'react-image-crop/dist/ReactCrop.css';
import { useAppDispatch } from '../../../../state/configureStore';
import { addToast } from '../../../../state/pageSlice';
import { toDataUrl } from '../../../utils/dataUrlFunctions';
import { CropModal } from '../../modals/cropModal/CropModal';

interface UploadSquareProps {
  onUpload?: (file?: Blob, filename?: string) => void;
  maxSizeMB?: number;
}
export const UploadButton: React.FC<UploadSquareProps> = ({ onUpload, maxSizeMB = 2 }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const [originalFileName, setOriginalFileName] = useState<string | undefined>(undefined);
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);

  const handleClick = () => {
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
      // Blur first: the input can still hold focus here, and MUI's Dialog hides the
      // rest of the app with aria-hidden, which conflicts with a focused descendant.
      event.target.blur();
      setCropDialogOpen(true);
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        title={t('common.selectImage')}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <Button variant="outlined" onClick={handleClick}>
        {t('common.upload')}
      </Button>
      <CropModal
        isOpen={cropDialogOpen}
        imageSrc={imageSrc}
        onClose={() => {
          setCropDialogOpen(false);
          if (inputRef.current) inputRef.current.value = '';
        }}
        onSave={(_url: string, file: Blob) => {
          if (onUpload) onUpload(file, originalFileName);
          setCropDialogOpen(false);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </Box>
  );
};
