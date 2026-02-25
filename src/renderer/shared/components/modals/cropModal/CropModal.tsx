import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AppBar, Box, Button, Dialog, DialogContent, IconButton, Toolbar, Tooltip, useTheme } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toDataUrl } from '../../../utils/dataUrlFunctions';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (url: string, file: Blob) => void;
  imageSrc?: string;
}
export const CropModal: React.FC<Props> = ({ onClose = () => {}, imageSrc, isOpen, onSave = () => {} }) => {
  const { t } = useTranslation();
  const DEFAULT_CROP: Crop = { unit: '%', width: 50, x: 0, y: 0, height: 50 };
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const theme = useTheme();

  const handleImageLoad = (img: HTMLImageElement) => {
    imgRef.current = img;
  };

  useEffect(() => {
    if (isOpen) {
      setCrop({ ...DEFAULT_CROP });
      imgRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, isOpen]);

  const makeClientCrop = async () => {
    if (!imgRef.current || !crop.width || !crop.height) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Convert crop coordinates to rendered-pixel space (handles both 'px' and '%' units)
    const pixelX = crop.unit === '%' ? (crop.x / 100) * image.width : crop.x;
    const pixelY = crop.unit === '%' ? (crop.y / 100) * image.height : crop.y;
    const pixelWidth = crop.unit === '%' ? (crop.width / 100) * image.width : crop.width;
    const pixelHeight = crop.unit === '%' ? (crop.height / 100) * image.height : crop.height;

    canvas.width = pixelWidth * scaleX;
    canvas.height = pixelHeight * scaleY;

    const ctx = canvas.getContext('2d', { alpha: true });

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      pixelX * scaleX,
      pixelY * scaleY,
      pixelWidth * scaleX,
      pixelHeight * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else resolve(null);
      }, 'image/png');
    });
  };

  const handleCropSave = async () => {
    const croppedBlob = await makeClientCrop();
    if (croppedBlob) {
      const croppedUrl = await toDataUrl(croppedBlob);

      if (onSave) onSave(croppedUrl, croppedBlob);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullScreen>
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

          <Button autoFocus color="inherit" onClick={handleCropSave}>
            {t('common.save')}
          </Button>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
        <Box style={{ maxWidth: '100%', maxHeight: '100%', overflow: 'auto' }}>
          <ReactCrop crop={crop} onChange={newCrop => setCrop(newCrop)} circularCrop={false} keepSelection>
            <img
              src={imageSrc}
              alt={t('common.crop')}
              ref={handleImageLoad as unknown as React.RefObject<HTMLImageElement>}
            />
          </ReactCrop>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
