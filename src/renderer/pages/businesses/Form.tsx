import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, FormControlLabel, Grid, Switch, TextField, Tooltip } from '@mui/material';
import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadImage } from '../../shared/components/inputs/uploadImage/UploadImage';
import { useForm } from '../../shared/hooks/useForm';
import type { Business, BusinessFromData } from '../../shared/types/business';
import { toDataUrl, toUint8Array } from '../../shared/utils/dataUrlFunctions';
import { validators } from '../../shared/utils/validatorFunctions';

interface Props {
  business?: Business;
  handleChange?: (data: { business: BusinessFromData; isFormValid: boolean; description?: string }) => void;
}
export const Form: FC<Props> = ({ handleChange = () => {}, business }) => {
  const { t } = useTranslation();
  const { form, setForm, update } = useForm<BusinessFromData>({
    id: business?.id,
    logo: business?.logo ?? undefined,
    email: business?.email ?? '',
    phone: business?.phone ?? '',
    name: business?.name ?? '',
    shortName: business?.shortName ?? '',
    role: business?.role ?? '',
    address: business?.address ?? '',
    website: business?.website ?? '',
    additional: business?.additional ?? '',
    vatCode: business?.vatCode ?? '',
    // Legacy payment info. New payment info is via Bank
    paymentInformation: business?.paymentInformation ?? '',
    fileSize: business?.fileSize,
    fileType: business?.fileType,
    fileName: business?.fileName,
    description: business?.description ?? '',
    isArchived: business?.isArchived ?? false
  });
  const [errors, setErrors] = useState({
    email: false,
    phone: false,
    name: false,
    shortName: false
  });
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  const onUpload = async (file?: Blob, filename?: string) => {
    if (file) {
      const fileUnitArray = await toUint8Array(t, file);
      if (fileUnitArray)
        setForm(prev => ({
          ...prev,
          logo: fileUnitArray,
          fileSize: file.size,
          fileType: file.type,
          fileName: filename
        }));
    } else {
      setForm(prev => ({ ...prev, logo: undefined, fileSize: undefined, fileType: undefined, fileName: undefined }));
    }
  };

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && (field === 'name' || field === 'shortName')) {
      setErrors(e => ({ ...e, [field]: true }));
    } else if (field === 'email') {
      setErrors(e => ({ ...e, email: value !== '' && !validators.email(value) }));
    } else if (field === 'phone') {
      setErrors(e => ({ ...e, phone: value !== '' && !validators.phone(value) }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useEffect(() => {
    setForm({
      id: business?.id,
      logo: business?.logo ?? undefined,
      email: business?.email ?? '',
      phone: business?.phone ?? '',
      name: business?.name ?? '',
      shortName: business?.shortName ?? '',
      role: business?.role ?? '',
      address: business?.address ?? '',
      website: business?.website ?? '',
      additional: business?.additional ?? '',
      vatCode: business?.vatCode ?? '',
      // Legacy payment info. New payment info is via Bank
      paymentInformation: business?.paymentInformation ?? '',
      fileSize: business?.fileSize,
      fileType: business?.fileType,
      fileName: business?.fileName,
      description: business?.description ?? '',
      isArchived: business?.isArchived ?? false
    });

    (async () => {
      const url = business && business.logo ? await toDataUrl(business.logo, business.fileType) : undefined;
      setLogoUrl(url);
    })();
  }, [business, setForm]);

  useEffect(() => {
    const valid =
      form.name.trim() !== '' &&
      form.shortName.trim() !== '' &&
      !errors.email &&
      !errors.phone &&
      !errors.name &&
      !errors.shortName;

    handleChange({
      business: form,
      isFormValid: valid,
      description: t('common.invalidForm')
    });
  }, [form, errors, handleChange, t]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', justifyContent: 'center' }}>
        <UploadImage onUpload={onUpload} imgUrl={logoUrl} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.name')}
          fullWidth
          required
          value={form.name}
          error={errors.name}
          helperText={errors.name ? t('common.fieldRequired') : ''}
          onChange={e => {
            update('name', e.target.value);
            validateField('name', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.shortName')}
          fullWidth
          required
          value={form.shortName}
          error={errors.shortName}
          helperText={errors.shortName ? t('common.fieldRequired') : t('common.shortNameHelper')}
          onChange={e => {
            update('shortName', e.target.value);
            validateField('shortName', e.target.value);
          }}
          slotProps={{
            htmlInput: {
              maxLength: 2
            }
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.address')}
          fullWidth
          value={form.address}
          onChange={e => update('address', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('businesses.role')}
          fullWidth
          value={form.role}
          onChange={e => update('role', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          type="email"
          label={t('common.email')}
          fullWidth
          value={form.email}
          onChange={e => {
            update('email', e.target.value);
            validateField('email', e.target.value);
          }}
          error={errors.email}
          helperText={errors.email ? t('common.invalidEmail') : ''}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.phone')}
          fullWidth
          value={form.phone}
          onChange={e => {
            update('phone', e.target.value);
            validateField('phone', e.target.value);
          }}
          error={errors.phone}
          helperText={errors.phone ? t('common.invalidPhone') : t('common.phoneHelper')}
          slotProps={{
            htmlInput: {
              maxLength: 16
            }
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('businesses.website')}
          fullWidth
          value={form.website}
          onChange={e => update('website', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.description')}
          fullWidth
          rows={5}
          value={form.description}
          onChange={e => update('description', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.vatCode')}
          fullWidth
          rows={5}
          value={form.vatCode}
          onChange={e => update('vatCode', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 12 }}>
        <TextField
          multiline
          label={t('common.additional')}
          fullWidth
          rows={5}
          value={form.additional}
          onChange={e => update('additional', e.target.value)}
        />
      </Grid>
      {form.paymentInformation && (
        <Grid size={{ xs: 12, md: 12 }}>
          {/* Legacy payment info. New payment info is via Bank */}
          <TextField
            multiline
            rows={5}
            fullWidth
            value={form.paymentInformation}
            disabled={true}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {t('common.paymentInfo')}
                <Tooltip title={t('common.paymentInfoLegacy')}>
                  <InfoOutlinedIcon fontSize="small" sx={{ color: 'action.active', cursor: 'pointer' }} />
                </Tooltip>
              </Box>
            }
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, md: 12 }}>
        <FormControlLabel
          control={<Switch checked={form.isArchived} onChange={e => update('isArchived', e.target.checked)} />}
          label={t('common.archived')}
        />
      </Grid>
    </Grid>
  );
};
