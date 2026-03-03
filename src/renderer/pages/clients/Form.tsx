import { FormControlLabel, Grid, Switch, TextField } from '@mui/material';
import { useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '../../shared/hooks/useForm';
import { useFormDirtyCheck } from '../../shared/hooks/useFormDirtyCheck';
import type { Client, ClientFromData } from '../../shared/types/client';
import { validators } from '../../shared/utils/validatorFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';

interface Props {
  client?: Client;
  handleChange?: (data: { client: ClientFromData; isFormValid: boolean; description?: string }) => void;
}
export const Form: FC<Props> = ({ handleChange = () => {}, client }) => {
  const { t } = useTranslation();
  const initialFormRef = useRef<ClientFromData | undefined>(undefined);
  const settings = useAppSelector(selectSettings);
  const { form, setForm, update } = useForm<ClientFromData>({
    id: client?.id,
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    name: client?.name ?? '',
    shortName: client?.shortName ?? '',
    code: client?.code ?? '',
    address: client?.address ?? '',
    vatCode: client?.vatCode ?? '',
    additional: client?.additional ?? '',
    description: client?.description ?? '',
    peppolEndpointSchemeId: client?.peppolEndpointSchemeId ?? '',
    buyerReference: client?.buyerReference ?? '',
    peppolEndpointId: client?.peppolEndpointId ?? '',
    countryCode: client?.countryCode ?? '',
    isArchived: client?.isArchived ?? false
  });
  const [errors, setErrors] = useState({
    email: false,
    phone: false,
    name: false,
    shortName: false,
    peppolEndpointSchemeId: false,
    peppolEndpointId: false,
    countryCode: false
  });

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && (field === 'name' || field === 'shortName')) {
      setErrors(e => ({ ...e, [field]: true }));
    } else if (field === 'peppolEndpointSchemeId') {
      setErrors(e => ({ ...e, peppolEndpointSchemeId: value !== '' && !validators.peppolEndpointSchemeId(value) }));
    } else if (field === 'peppolEndpointId') {
      setErrors(e => ({ ...e, peppolEndpointId: value !== '' && !validators.peppolEndpointId(value) }));
    } else if (field === 'countryCode') {
      setErrors(e => ({ ...e, countryCode: value !== '' && !validators.countryCode(value) }));
    } else if (field === 'email') {
      setErrors(e => ({ ...e, email: value !== '' && !validators.email(value) }));
    } else if (field === 'phone') {
      setErrors(e => ({ ...e, phone: value !== '' && !validators.phone(value) }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useFormDirtyCheck(form, initialFormRef);

  useEffect(() => {
    const initial = {
      id: client?.id,
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      name: client?.name ?? '',
      shortName: client?.shortName ?? '',
      code: client?.code ?? '',
      address: client?.address ?? '',
      vatCode: client?.vatCode ?? '',
      additional: client?.additional ?? '',
      description: client?.description ?? '',
      peppolEndpointSchemeId: client?.peppolEndpointSchemeId ?? '',
      buyerReference: client?.buyerReference ?? '',
      peppolEndpointId: client?.peppolEndpointId ?? '',
      countryCode: client?.countryCode ?? '',
      isArchived: client?.isArchived ?? false
    };
    initialFormRef.current = initial;
    setForm(initial);
  }, [client, setForm]);

  useEffect(() => {
    const valid =
      form.name.trim() !== '' &&
      form.shortName.trim() !== '' &&
      !errors.email &&
      !errors.phone &&
      !errors.name &&
      !errors.shortName &&
      !errors.countryCode &&
      !errors.peppolEndpointId &&
      !errors.peppolEndpointSchemeId;

    handleChange({
      client: form,
      isFormValid: valid,
      description: t('common.invalidForm')
    });
  }, [form, errors, handleChange, t]);

  return (
    <Grid container spacing={2}>
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
          helperText={t('common.addressHelper')}
          onChange={e => update('address', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.code')}
          fullWidth
          value={form.code}
          onChange={e => update('code', e.target.value)}
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
          label={t('common.description')}
          fullWidth
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
      {settings?.ublON && (
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label={t('common.peppolEndpointId')}
            fullWidth
            value={form.peppolEndpointId}
            error={errors.peppolEndpointId}
            helperText={errors.phone ? t('common.invalidPeppolEndpointId') : t('common.peppolEndpointIdHelper')}
            onChange={e => {
              update('peppolEndpointId', e.target.value);
              validateField('peppolEndpointId', e.target.value);
            }}
          />
        </Grid>
      )}
      {settings?.ublON && (
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label={t('common.peppolEndpointSchemeId')}
            fullWidth
            value={form.peppolEndpointSchemeId}
            error={errors.peppolEndpointSchemeId}
            helperText={
              errors.phone ? t('common.invalidPeppolEndpointSchemeId') : t('common.peppolEndpointSchemeIdHelper')
            }
            onChange={e => {
              update('peppolEndpointSchemeId', e.target.value);
              validateField('peppolEndpointSchemeId', e.target.value);
            }}
          />
        </Grid>
      )}
      {settings?.ublON && (
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label={t('common.buyerReference')}
            fullWidth
            value={form.buyerReference}
            onChange={e => {
              update('buyerReference', e.target.value);
            }}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.countryCode')}
          fullWidth
          value={form.countryCode}
          error={errors.countryCode}
          helperText={errors.phone ? t('common.invalidCountryCode') : t('common.countryCodeHelper')}
          onChange={e => {
            update('countryCode', e.target.value);
            validateField('countryCode', e.target.value);
          }}
          slotProps={{
            htmlInput: {
              maxLength: 2
            }
          }}
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
      <Grid size={{ xs: 12, md: 12 }}>
        <FormControlLabel
          control={<Switch checked={form.isArchived} onChange={e => update('isArchived', e.target.checked)} />}
          label={t('common.archived')}
        />
      </Grid>
    </Grid>
  );
};
