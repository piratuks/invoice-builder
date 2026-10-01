import { Box, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, Typography } from '@mui/material';
import { MuiColorInput } from 'mui-color-input';
import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SizeType } from '@invoice-builder/contracts';

import { useForm } from '../../../../hooks/form/useForm';
import type { CustomizationFormBranding } from '../../../../types/invoice';
import { toDataUrl, toUint8Array } from '../../../../utils/dataUrlFunctions';
import { UploadImage } from '../../../inputs/uploadImage/UploadImage';
import { TabPanel } from '../../tabPanel/TabPanel';

interface Props {
  value: number;
  onChange?: (data: CustomizationFormBranding) => void;
  data?: CustomizationFormBranding;
}
export const BrandingTab: FC<Props> = ({ data, value, onChange }) => {
  const { t } = useTranslation();
  const { form, setForm, update } = useForm<CustomizationFormBranding>(data ?? {});
  const lastEmittedRef = useRef<CustomizationFormBranding | undefined>(data);
  const [watermarkUrl, setWatermarkUrl] = useState<string | undefined>(undefined);
  const [watermarkPaidUrl, setWatermarkPaidUrl] = useState<string | undefined>(undefined);
  const [colorInput, setColorInput] = useState<string>(form.color ?? '');
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onUploadPaidWatermark = async (file?: Blob, filename?: string) => {
    if (file) {
      const fileUnitArray = await toUint8Array(t, file);
      if (fileUnitArray)
        setForm(prev => ({
          ...prev,
          paidWatermarkFileData: fileUnitArray,
          paidWatermarkFileSize: file.size,
          paidWatermarkFileType: file.type,
          paidWatermarkFileName: filename
        }));
    } else {
      setForm(prev => ({
        ...prev,
        paidWatermarkFileData: undefined,
        paidWatermarkFileSize: undefined,
        paidWatermarkFileType: undefined,
        paidWatermarkFileName: undefined
      }));
    }
  };

  const onUploadWatermark = async (file?: Blob, filename?: string) => {
    if (file) {
      const fileUnitArray = await toUint8Array(t, file);
      if (fileUnitArray)
        setForm(prev => ({
          ...prev,
          watermarkFileData: fileUnitArray,
          watermarkFileSize: file.size,
          watermarkFileType: file.type,
          watermarkFileName: filename
        }));
    } else {
      setForm(prev => ({
        ...prev,
        watermarkFileData: undefined,
        watermarkFileSize: undefined,
        watermarkFileType: undefined,
        watermarkFileName: undefined
      }));
    }
  };

  const updateUrl = useCallback(
    async (
      fileData: Uint8Array | undefined,
      fileType: string | undefined,
      setUrl: React.Dispatch<React.SetStateAction<string | undefined>>
    ) => {
      const newUrl = fileData ? await toDataUrl(fileData, fileType) : undefined;

      setUrl(newUrl);
    },
    []
  );

  useEffect(() => {
    if (data) {
      setForm(data);

      updateUrl(data.watermarkFileData, data.watermarkFileType, setWatermarkUrl);
      updateUrl(data.paidWatermarkFileData, data.paidWatermarkFileType, setWatermarkPaidUrl);
    }
  }, [data, setForm, updateUrl]);

  useEffect(() => {
    setColorInput(form.color ?? '');
  }, [form.color]);

  useEffect(() => {
    return () => {
      if (colorDebounceRef.current) {
        clearTimeout(colorDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!form) return;
    let isChanged = false;
    try {
      const prevForm = lastEmittedRef.current;
      isChanged = JSON.stringify(prevForm) !== JSON.stringify(form);
    } catch {
      isChanged = true;
    }
    if (!isChanged) return;

    updateUrl(form.watermarkFileData, form.watermarkFileType, setWatermarkUrl);
    updateUrl(form.paidWatermarkFileData, form.paidWatermarkFileType, setWatermarkPaidUrl);

    lastEmittedRef.current = form;
    onChange?.(form);
  }, [form, onChange, updateUrl]);

  return (
    <TabPanel value={value} index={1}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MuiColorInput
            value={colorInput}
            label={t('common.color')}
            format="hex"
            onChange={(_e, newValue) => {
              const hex = typeof newValue === 'string' ? newValue : newValue.hex;
              setColorInput(hex);

              if (colorDebounceRef.current) {
                clearTimeout(colorDebounceRef.current);
              }

              colorDebounceRef.current = setTimeout(() => {
                update('color', hex);
              }, 150);
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">{t('common.logoSizeStyle')}</FormLabel>
            <RadioGroup
              row
              value={form.logoSize ?? ''}
              onChange={(_e, newValue) => {
                update('logoSize', newValue as SizeType);
              }}
            >
              <FormControlLabel value={SizeType.small} control={<Radio />} label={t('common.small')} />
              <FormControlLabel value={SizeType.medium} control={<Radio />} label={t('common.medium')} />
              <FormControlLabel value={SizeType.large} control={<Radio />} label={t('common.large')} />
            </RadioGroup>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            component="legend"
            variant="body1"
            sx={{ fontWeight: 400, color: 'text.secondary', marginBottom: 1 }}
          >
            {t('common.watermark')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'start',
              alignItems: 'start',
              width: '100%',
              gap: 1
            }}
          >
            <UploadImage onUpload={onUploadWatermark} imgUrl={watermarkUrl} size={100} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            component="legend"
            variant="body1"
            sx={{ fontWeight: 400, color: 'text.secondary', marginBottom: 1 }}
          >
            {t('common.paidWatermark')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'start',
              alignItems: 'start',
              width: '100%',
              gap: 1
            }}
          >
            <UploadImage onUpload={onUploadPaidWatermark} imgUrl={watermarkPaidUrl} size={100} />
          </Box>
        </Grid>
      </Grid>
    </TabPanel>
  );
};
