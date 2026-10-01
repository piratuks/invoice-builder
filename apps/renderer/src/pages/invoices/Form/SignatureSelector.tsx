import GestureIcon from '@mui/icons-material/Gesture';
import { Box, IconButton, ListItemButton, ListItemText, Tooltip, Typography } from '@mui/material';
import { memo, useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadImage } from '../../../shared/components/inputs/uploadImage/UploadImage';
import type { SignatureForm } from '../../../shared/types/invoice';
import { toDataUrl } from '../../../shared/utils/dataUrlFunctions';
import { SignatureDropdown } from './Dropdowns/SignatureDropdown';

interface Props {
  data?: {
    signatureData?: Uint8Array<ArrayBufferLike>;
    signatureType?: string;
    signatureSize?: number;
    signatureName?: string;
  };
  onEdit: (data: SignatureForm) => void;
}
const SignatureSelectorComponent: FC<Props> = ({ data, onEdit }) => {
  const { signatureData, signatureType, signatureSize, signatureName } = data ?? {};

  const { t } = useTranslation();

  const [isDropdownOpenSignature, setIsDropdownOpenSignature] = useState<boolean>(false);
  const [formData, setFormData] = useState<SignatureForm | undefined>(undefined);
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>(undefined);

  const onUpload = async (file?: Blob, filename?: string) => {
    if (!file && !filename) {
      const newFormData = {
        data: undefined,
        size: undefined,
        type: undefined,
        name: undefined
      };
      setFormData(newFormData);
      onEdit(newFormData);
    }
  };

  const handleOnOpen = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
  }, []);

  const handleOnClose = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
  }, []);

  useEffect(() => {
    if (!signatureData) {
      setSignatureUrl(undefined);
    } else {
      (async () => {
        const url = signatureData ? await toDataUrl(signatureData, signatureType) : undefined;
        setSignatureUrl(url);
      })();
    }

    setFormData({
      data: signatureData,
      size: signatureSize,
      type: signatureType,
      name: signatureName
    });
  }, [signatureData, signatureSize, signatureType, signatureName]);

  return (
    <>
      <ListItemButton
        onClick={() => {
          handleOnOpen(setIsDropdownOpenSignature);
        }}
        sx={{
          pt: 2,
          pb: 2,
          pl: 2,
          pr: 2,
          width: '100%',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'start',
          flexDirection: 'column'
        }}
      >
        <ListItemText
          primary={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Tooltip title={t('common.signature')}>
                <IconButton size="small" data-drag-handle onMouseDown={e => e.stopPropagation()}>
                  <GestureIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography
                component="div"
                variant="body1"
                sx={{ fontWeight: 600, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {t('common.signature').toUpperCase()}
              </Typography>
            </Box>
          }
          disableTypography
          sx={{ m: 0 }}
          slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
        />
      </ListItemButton>

      {signatureUrl && (
        <Box
          sx={{
            display: 'flex',
            position: 'relative',
            width: '100%',
            paddingLeft: 2,
            paddingRight: 2,
            paddingBottom: 2
          }}
        >
          <UploadImage
            imgUrl={signatureUrl}
            size={200}
            disableEdit={true}
            onUpload={(file?: Blob, filename?: string) => onUpload(file, filename)}
          />
        </Box>
      )}

      {formData && (
        <SignatureDropdown
          isOpen={isDropdownOpenSignature}
          onClose={() => handleOnClose(setIsDropdownOpenSignature)}
          onOpen={() => handleOnOpen(setIsDropdownOpenSignature)}
          onClick={data => {
            onEdit(data);
            handleOnClose(setIsDropdownOpenSignature);
          }}
          form={formData}
        />
      )}
    </>
  );
};
export const SignatureSelector = memo(SignatureSelectorComponent);
