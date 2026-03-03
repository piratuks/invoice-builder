import { Box, FormControlLabel, Grid, Switch, TextField, Typography } from '@mui/material';
import { useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadImage } from '../../shared/components/inputs/uploadImage/UploadImage';
import { useForm } from '../../shared/hooks/useForm';
import { useFormDirtyCheck } from '../../shared/hooks/useFormDirtyCheck';
import type { Bank, BankFromData } from '../../shared/types/bank';
import { toDataUrl, toUint8Array } from '../../shared/utils/dataUrlFunctions';
import { validators } from '../../shared/utils/validatorFunctions';

interface Props {
  bank?: Bank;
  handleChange?: (data: { bank: BankFromData; isFormValid: boolean; description?: string }) => void;
}
export const Form: FC<Props> = ({ handleChange = () => {}, bank }) => {
  const { t } = useTranslation();
  const initialFormRef = useRef<BankFromData | undefined>(undefined);
  const { form, setForm, update } = useForm<BankFromData>({
    id: bank?.id,
    qrCode: bank?.qrCode ?? undefined,
    name: bank?.name ?? '',
    bankName: bank?.bankName ?? '',
    accountNumber: bank?.accountNumber ?? '',
    swiftCode: bank?.swiftCode ?? '',
    address: bank?.address ?? '',
    branchCode: bank?.branchCode ?? '',
    type: bank?.type ?? '',
    routingNumber: bank?.routingNumber ?? '',
    accountHolder: bank?.accountHolder ?? '',
    sortOrder: bank?.sortOrder ?? '',
    upiCode: bank?.upiCode ?? '',
    qrCodeFileSize: bank?.qrCodeFileSize,
    qrCodeFileType: bank?.qrCodeFileType,
    qrCodeFileName: bank?.qrCodeFileName,
    isArchived: bank?.isArchived ?? false
  });
  const [errors, setErrors] = useState({
    name: false,
    accountNumber: false,
    swiftCode: false,
    sortOrder: false,
    branchCode: false,
    routingNumber: false,
    upiCode: false
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(undefined);

  const onUpload = async (file?: Blob, filename?: string) => {
    if (file) {
      const fileUnitArray = await toUint8Array(t, file);
      if (fileUnitArray)
        setForm(prev => ({
          ...prev,
          qrCode: fileUnitArray,
          qrCodeFileSize: file.size,
          qrCodeFileType: file.type,
          qrCodeFileName: filename
        }));
    } else {
      setForm(prev => ({
        ...prev,
        qrCode: undefined,
        qrCodeFileSize: undefined,
        qrCodeFileType: undefined,
        qrCodeFileName: undefined
      }));
    }
  };

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && field === 'name') {
      setErrors(e => ({ ...e, [field]: true }));
    } else if (value !== '' && !validators.accountNumber(value) && field === 'accountNumber') {
      setErrors(e => ({ ...e, [field]: true }));
    } else if (value !== '' && !validators.swift(value) && field === 'swiftCode') {
      setErrors(e => ({ ...e, [field]: true }));
    } else if (value !== '' && !validators.sortCode(value) && field === 'sortOrder') {
      setErrors(e => ({ ...e, [field]: true }));
    } else if (value !== '' && !validators.branchCode(value) && field === 'branchCode') {
      setErrors(e => ({ ...e, [field]: true }));
    } else if (value !== '' && !validators.routingNumber(value) && field === 'routingNumber') {
      setErrors(e => ({ ...e, [field]: true }));
    } else if (value !== '' && !validators.upiOrPix(value) && field === 'upiCode') {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useFormDirtyCheck(form, initialFormRef);

  useEffect(() => {
    const initial = {
      id: bank?.id,
      qrCode: bank?.qrCode ?? undefined,
      name: bank?.name ?? '',
      bankName: bank?.bankName ?? '',
      accountNumber: bank?.accountNumber ?? '',
      swiftCode: bank?.swiftCode ?? '',
      address: bank?.address ?? '',
      branchCode: bank?.branchCode ?? '',
      type: bank?.type ?? '',
      routingNumber: bank?.routingNumber ?? '',
      accountHolder: bank?.accountHolder ?? '',
      sortOrder: bank?.sortOrder ?? '',
      upiCode: bank?.upiCode ?? '',
      qrCodeFileSize: bank?.qrCodeFileSize,
      qrCodeFileType: bank?.qrCodeFileType,
      qrCodeFileName: bank?.qrCodeFileName,
      isArchived: bank?.isArchived ?? false
    };
    initialFormRef.current = initial;
    setForm(initial);
    (async () => {
      const url = bank && bank.qrCode ? await toDataUrl(bank.qrCode, bank.qrCodeFileType) : undefined;
      setQrCodeUrl(url);
    })();
  }, [bank, setForm]);

  useEffect(() => {
    const valid =
      form.name.trim() !== '' &&
      !errors.name &&
      !errors.accountNumber &&
      !errors.swiftCode &&
      !errors.sortOrder &&
      !errors.branchCode &&
      !errors.routingNumber &&
      !errors.upiCode;

    handleChange({
      bank: form,
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
          label={t('common.accountHolder')}
          fullWidth
          value={form.accountHolder}
          onChange={e => {
            update('accountHolder', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.bankName')}
          fullWidth
          value={form.bankName}
          onChange={e => {
            update('bankName', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.type')}
          fullWidth
          value={form.type}
          onChange={e => {
            update('type', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.accountNumber')}
          fullWidth
          value={form.accountNumber}
          error={errors.accountNumber}
          helperText={errors.accountNumber ? t('common.accountNumberInvalid') : ''}
          onChange={e => {
            update('accountNumber', e.target.value);
            validateField('accountNumber', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.swiftCode')}
          fullWidth
          value={form.swiftCode}
          error={errors.swiftCode}
          helperText={errors.swiftCode ? t('common.swiftCodeInvalid') : ''}
          onChange={e => {
            update('swiftCode', e.target.value);
            validateField('swiftCode', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.sortOrder')}
          fullWidth
          value={form.sortOrder}
          error={errors.sortOrder}
          helperText={errors.sortOrder ? t('common.sortCodeInvalid') : ''}
          onChange={e => {
            update('sortOrder', e.target.value);
            validateField('sortOrder', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.address')}
          fullWidth
          value={form.address}
          onChange={e => {
            update('address', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.branchCode')}
          fullWidth
          value={form.branchCode}
          error={errors.branchCode}
          helperText={errors.branchCode ? t('common.branchCodeInvalid') : ''}
          onChange={e => {
            update('branchCode', e.target.value);
            validateField('branchCode', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.routingNumber')}
          fullWidth
          value={form.routingNumber}
          error={errors.routingNumber}
          helperText={errors.routingNumber ? t('common.routingNumberInvalid') : ''}
          onChange={e => {
            update('routingNumber', e.target.value);
            validateField('routingNumber', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.upiCode')}
          fullWidth
          value={form.upiCode}
          error={errors.upiCode}
          helperText={errors.upiCode ? t('common.upiCodeInvalid') : ''}
          onChange={e => {
            update('upiCode', e.target.value);
            validateField('upiCode', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography
          component="legend"
          variant="body1"
          sx={{ fontWeight: 400, color: 'text.secondary', marginBottom: 1 }}
        >
          {t('common.qrCode')}
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
          <UploadImage onUpload={onUpload} imgUrl={qrCodeUrl} size={100} />
        </Box>
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
