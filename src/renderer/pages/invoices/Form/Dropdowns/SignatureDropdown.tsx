import { Box, Button, Grid, SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { memo, useCallback, useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import SignatureCanvas from 'react-signature-canvas';
import { UploadButton } from '../../../../shared/components/controls/uploadButton/UploadButton';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';
import type { SignatureForm } from '../../../../shared/types/invoice';
import { toDataUrl, toUint8Array } from '../../../../shared/utils/dataUrlFunctions';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (form: SignatureForm) => void;
  form: SignatureForm;
}
const SignatureDropdownComponent: FC<Props> = ({ isOpen, form, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const sigRef = useRef<SignatureCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  const [formData, setFormData] = useState<SignatureForm>({
    data: undefined,
    size: undefined,
    type: undefined,
    name: undefined
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(form);
    }
  }, [isOpen, form]);

  const clearSignature = useCallback(() => {
    sigRef.current?.clear();
  }, []);

  const loadSignature = useCallback(async () => {
    if (sigRef.current !== null && formData.data) {
      const url = formData.data ? await toDataUrl(formData.data, formData.type) : undefined;

      const canvas = sigRef.current?.getCanvas();
      if (canvas && url) {
        canvas.width = canvasWidth;
        canvas.height = 200;

        const image = new Image();
        image.onload = () => {
          // Fit the image within the canvas while preserving its aspect ratio, centered
          const naturalWidth = image.naturalWidth || canvas.width;
          const naturalHeight = image.naturalHeight || canvas.height;
          const scale = Math.min(canvas.width / naturalWidth, canvas.height / naturalHeight);
          const width = naturalWidth * scale;
          const height = naturalHeight * scale;
          const xOffset = (canvas.width - width) / 2;
          const yOffset = (canvas.height - height) / 2;

          // signature_pad's fromDataURL always draws at (0, 0), so pre-compose the centered
          // image on an offscreen canvas the same size as the visible one, then load that
          const offscreen = document.createElement('canvas');
          offscreen.width = canvas.width;
          offscreen.height = canvas.height;
          offscreen.getContext('2d')?.drawImage(image, xOffset, yOffset, width, height);

          sigRef.current?.fromDataURL(offscreen.toDataURL(), { width: canvas.width, height: canvas.height });
        };
        image.src = url;
      }
    }
  }, [formData, canvasWidth]);

  const saveSignature = useCallback(() => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;

    sigRef.current.getCanvas().toBlob(async blob => {
      const fileUnitArray = await toUint8Array(t, blob);
      const formData = {
        data: fileUnitArray ?? undefined,
        size: blob ? blob.size : 0,
        type: blob ? blob.type : '',
        name: 'signature.png'
      };
      setFormData(formData);

      onClick?.(formData);

      clearSignature();
    });
  }, [clearSignature, onClick, t]);

  const onUploadSignature = useCallback(
    async (file?: Blob, filename?: string) => {
      if (file) {
        const fileUnitArray = await toUint8Array(t, file);
        const formData = {
          data: fileUnitArray ?? undefined,
          size: file ? file.size : 0,
          type: file ? file.type : '',
          name: filename
        };

        setFormData(formData);
      }
    },
    [t]
  );

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.offsetWidth);
      }
    };

    setTimeout(() => {
      handleResize();
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [form, isOpen]);

  useEffect(() => {
    if (formData.data) {
      loadSignature();
    } else {
      sigRef.current?.clear();
    }
  }, [formData, loadSignature]);

  return (
    <>
      <SwipeableDrawer
        anchor="bottom"
        open={isOpen}
        onClose={() => {
          onClose?.();
          clearSignature();
        }}
        onOpen={() => onOpen?.()}
        slotProps={{
          paper: {
            sx: {
              maxWidth: isDesktop ? '40%' : '100%',
              height: isDesktop ? '30%' : '40%',
              mx: 'auto',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              p: 3
            }
          }
        }}
      >
        <Box sx={{ mb: 2 }}>
          <PageHeader
            title={t('invoices.addSignature')}
            showBack={false}
            showSave={true}
            showClose={false}
            formData={formData}
            isFormValid={true}
            onClose={onClose}
            onSave={() => {
              saveSignature();
            }}
            renderCustomButtons={() => {
              return (
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                  <UploadButton onUpload={onUploadSignature} />
                  <Button variant="outlined" onClick={clearSignature}>
                    {t('ariaLabel.clear')}
                  </Button>
                </Box>
              );
            }}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Box
              ref={containerRef}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                width: '100%',
                height: 200
              }}
            >
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  width: canvasWidth,
                  height: 200,
                  style: {
                    width: '100%',
                    height: '100%'
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </SwipeableDrawer>
    </>
  );
};
export const SignatureDropdown = memo(SignatureDropdownComponent);
