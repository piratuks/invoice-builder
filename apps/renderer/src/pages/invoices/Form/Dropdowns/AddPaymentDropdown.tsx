import { Autocomplete, Box, Grid, SwipeableDrawer, TextField, useMediaQuery, useTheme } from '@mui/material';
import { memo, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AmountInput } from '../../../../shared/components/inputs/amountInput/AmountInput';
import { Datepicker } from '../../../../shared/components/inputs/datepicker/Datepicker';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';
import { PaymentType } from '@invoice-builder/contracts';
import { useForm } from '../../../../shared/hooks/form/useForm';
import type { PaymentForm } from '../../../../shared/types/invoice';
import { validators } from '../../../../shared/utils/validatorFunctions';
import { useAppSelector } from '../../../../state/configureStore';
import { selectSettings } from '../../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: PaymentForm) => void;
  data?: PaymentForm;
}
const AddPaymentDropdownComponent: FC<Props> = ({ isOpen, data, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const storeSettings = useAppSelector(selectSettings);

  const paymentOption = [
    { label: t('common.cash'), value: PaymentType.cash },
    { label: t('common.cheque'), value: PaymentType.cheque },
    { label: t('common.bank'), value: PaymentType.bank },
    { label: t('common.creditCard'), value: PaymentType.creditCard },
    { label: t('common.paypal'), value: PaymentType.paypal },
    { label: t('common.other'), value: PaymentType.other }
  ];

  const { form, setForm, update } = useForm<PaymentForm>({
    paymentMethod: data?.paymentMethod ?? PaymentType.cash,
    paidAmount: data?.paidAmount ?? 0,
    paidAt: data?.paidAt ?? '',
    notes: data?.notes ?? '',
    id: data?.id
  });

  const [errors, setErrors] = useState({
    paidAmount: false,
    paidAt: false,
    paymentMethod: false
  });
  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && (field === 'paidAmount' || field === 'paidAt' || field === 'paymentMethod')) {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setForm({
        paymentMethod: data?.paymentMethod ?? PaymentType.cash,
        paidAmount: data?.paidAmount ?? 0,
        paidAt: data?.paidAt ?? '',
        notes: data?.notes ?? '',
        id: data?.id
      });
      setErrors({
        paidAmount: false,
        paidAt: false,
        paymentMethod: false
      });
    }
  }, [isOpen, data, setForm]);

  useEffect(() => {
    const valid =
      typeof form.paidAmount !== 'undefined' &&
      typeof form.paymentMethod !== 'undefined' &&
      typeof form.paidAt !== 'undefined' &&
      form.paidAt !== '';

    setIsFormValid(valid);
  }, [form, errors]);
  return (
    <>
      <SwipeableDrawer
        anchor="bottom"
        open={isOpen}
        onClose={() => onClose?.()}
        onOpen={() => onOpen?.()}
        slotProps={{
          paper: {
            sx: {
              maxWidth: isDesktop ? '40%' : '100%',
              height: '30%',
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
            title={t('invoices.addPayment')}
            showBack={false}
            showSave={true}
            showClose={false}
            formData={form}
            isFormValid={isFormValid}
            onClose={onClose}
            onSave={data => {
              onClick?.(data as PaymentForm);
            }}
          />
        </Box>
        <Grid container spacing={2}>
          {storeSettings && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                fullWidth
                options={paymentOption}
                getOptionLabel={option => option.label}
                disableClearable={true}
                value={paymentOption.find(opt => opt.value === form.paymentMethod) ?? paymentOption[0]}
                onChange={(_e, newValue) => {
                  update('paymentMethod', newValue.value);
                  validateField('paymentMethod', newValue.value.toString());
                }}
                renderInput={params => <TextField {...params} label={t('invoices.type')} required />}
                freeSolo={false}
              />
            </Grid>
          )}
          {storeSettings && (
            <Grid size={{ xs: 12, md: 6 }}>
              <AmountInput
                required={true}
                amountFormat={storeSettings?.amountFormat}
                label={t('common.amount')}
                value={form.paidAmount}
                error={errors.paidAmount}
                helperText={errors.paidAmount ? t('common.fieldRequired') : ''}
                onChange={e => {
                  update('paidAmount', e);
                  validateField('paidAmount', (e ?? '').toString());
                }}
              />
            </Grid>
          )}
          {storeSettings && (
            <Grid size={{ xs: 12, md: 12 }}>
              <Datepicker
                label={`${t('invoices.paidAt')}`}
                error={errors.paidAt}
                required={true}
                value={form.paidAt}
                format={storeSettings.dateFormat}
                onChange={value => {
                  update('paidAt', value);
                  validateField('paidAt', value ?? '');
                }}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 12 }}>
            <TextField
              label={t('invoices.notes')}
              fullWidth
              value={form.notes}
              onChange={e => {
                update('notes', e.target.value);
              }}
            />
          </Grid>
        </Grid>
      </SwipeableDrawer>
    </>
  );
};
export const AddPaymentDropdown = memo(AddPaymentDropdownComponent);
