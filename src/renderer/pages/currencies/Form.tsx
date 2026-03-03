import { Autocomplete, FormControlLabel, Grid, Switch, TextField } from '@mui/material';
import { useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '../../shared/hooks/useForm';
import { useFormDirtyCheck } from '../../shared/hooks/useFormDirtyCheck';
import type { Currency, CurrencyFromData } from '../../shared/types/currency';
import { getFormattedLabel } from '../../shared/utils/formatFunctions';
import { validators } from '../../shared/utils/validatorFunctions';
import { CURRENCY_FORMAT_ITEMS_ARRAY } from '../../state/constant';

interface Props {
  currency?: Currency;
  handleChange?: (data: { currency: CurrencyFromData; isFormValid: boolean; description?: string }) => void;
}
export const Form: FC<Props> = ({ handleChange = () => {}, currency }) => {
  const { t } = useTranslation();
  const initialFormRef = useRef<CurrencyFromData | undefined>(undefined);
  const optionsCurrencyFormat = CURRENCY_FORMAT_ITEMS_ARRAY;
  const { form, setForm, update } = useForm<CurrencyFromData>({
    id: currency?.id,
    code: currency?.code ?? '',
    symbol: currency?.symbol ?? '',
    text: currency?.text ?? '',
    format: currency?.format ?? '',
    isArchived: currency?.isArchived ?? false,
    subunit: currency?.subunit ?? 0
  });
  const [errors, setErrors] = useState({
    code: false,
    symbol: false,
    text: false,
    format: false,
    subunit: false
  });

  const isFormatDisabled = form.code.trim() === '' || form.symbol.trim() === '';
  const hasSelectedFormat = form.format.trim() !== '';

  const validateField = (field: keyof typeof errors, value: string) => {
    if (
      !validators.required(value) &&
      (field === 'code' || field === 'symbol' || field === 'text' || field === 'format' || field === 'subunit')
    ) {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useFormDirtyCheck(form, initialFormRef);

  useEffect(() => {
    const initial = {
      id: currency?.id,
      code: currency?.code ?? '',
      symbol: currency?.symbol ?? '',
      text: currency?.text ?? '',
      format: currency?.format ?? '',
      isArchived: currency?.isArchived ?? false,
      subunit: currency?.subunit ?? 0
    };
    initialFormRef.current = initial;
    setForm(initial);
  }, [currency, setForm]);

  useEffect(() => {
    const valid =
      form.code.trim() !== '' &&
      form.symbol.trim() !== '' &&
      form.text.trim() !== '' &&
      form.format.trim() !== '' &&
      form.subunit.toString().trim() !== '';

    handleChange({
      currency: form,
      isFormValid: valid,
      description: t('common.invalidForm')
    });
  }, [form, errors, handleChange, t]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          label={t('currencies.code')}
          fullWidth
          required
          value={form.code}
          error={errors.code}
          helperText={errors.code ? t('common.fieldRequired') : ''}
          onChange={e => {
            update('code', e.target.value);
            validateField('code', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          label={t('currencies.symbol')}
          fullWidth
          required
          value={form.symbol}
          error={errors.symbol}
          helperText={errors.symbol ? t('common.fieldRequired') : ''}
          onChange={e => {
            update('symbol', e.target.value);
            validateField('symbol', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Autocomplete
          fullWidth
          disabled={isFormatDisabled}
          options={optionsCurrencyFormat}
          getOptionLabel={option => getFormattedLabel({ label: option.label, symbol: form.symbol, code: form.code })}
          disableClearable={hasSelectedFormat}
          value={optionsCurrencyFormat.find(opt => opt.value === form.format) ?? null}
          onChange={(_e, newValue) => {
            if (!newValue) return;
            update('format', newValue.value);
            validateField('format', newValue.value);
          }}
          renderOption={(props, option) => {
            return (
              <li {...props} key={option.value}>
                {getFormattedLabel({ label: option.label, symbol: form.symbol, code: form.code })}
              </li>
            );
          }}
          renderInput={params => (
            <TextField
              {...params}
              error={errors.format}
              helperText={errors.format ? t('common.fieldRequired') : ''}
              label={t('currencies.format')}
              required
            />
          )}
          freeSolo={false}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          label={t('currencies.subunit')}
          fullWidth
          required
          type="number"
          value={form.subunit}
          error={errors.subunit}
          helperText={errors.subunit ? t('common.fieldRequired') : ''}
          onChange={e => {
            update('subunit', Number(e.target.value));
            validateField('subunit', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 12 }}>
        <TextField
          label={t('common.text')}
          fullWidth
          required
          value={form.text}
          error={errors.text}
          helperText={errors.text ? t('common.fieldRequired') : ''}
          onChange={e => {
            update('text', e.target.value);
            validateField('text', e.target.value);
          }}
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
