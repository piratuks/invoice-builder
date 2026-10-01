import { Autocomplete, Box, Grid, SwipeableDrawer, TextField, useMediaQuery, useTheme } from '@mui/material';
import { memo, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AmountInput } from '../../../../shared/components/inputs/amountInput/AmountInput';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';
import { DiscountType } from '@invoice-builder/contracts';
import { useForm } from '../../../../shared/hooks/form/useForm';
import type { DiscountForm } from '../../../../shared/types/invoice';
import { validators } from '../../../../shared/utils/validatorFunctions';
import { useAppSelector } from '../../../../state/configureStore';
import { selectSettings } from '../../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: DiscountForm) => void;
  data?: DiscountForm;
}
const DiscountDropdownComponent: FC<Props> = ({ isOpen, data, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();

  const discountTypeOptions = [
    { label: t('invoices.none'), value: undefined },
    { label: t('invoices.fixed'), value: DiscountType.fixed },
    { label: t('invoices.percentage'), value: DiscountType.percentage }
  ];

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const storeSettings = useAppSelector(selectSettings);

  const { form, setForm, update } = useForm<DiscountForm>({
    discountType: data?.discountType,
    discountAmount: data?.discountAmount ?? 0,
    discountRate: data?.discountRate ?? 0,
    discountName: data?.discountName ?? ''
  });
  const [errors, setErrors] = useState({
    discountAmount: false,
    discountRate: false
  });
  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && (field === 'discountAmount' || field === 'discountRate')) {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setForm({
        discountType: data?.discountType,
        discountAmount: data?.discountAmount ?? 0,
        discountRate: data?.discountRate ?? 0,
        discountName: data?.discountName ?? ''
      });
      setErrors({
        discountAmount: false,
        discountRate: false
      });
    }
  }, [isOpen, data, setForm]);

  useEffect(() => {
    const valid =
      (form.discountType === DiscountType.fixed && typeof form.discountAmount !== 'undefined') ||
      (form.discountType === DiscountType.percentage && typeof form.discountRate !== 'undefined') ||
      !form.discountType;

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
              height: isDesktop ? '30%' : '50%',
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
            title={t('invoices.addDiscount')}
            showBack={false}
            showSave={true}
            showClose={false}
            formData={form}
            isFormValid={isFormValid}
            onClose={onClose}
            onSave={data => {
              onClick?.(data as DiscountForm);
            }}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Autocomplete
              fullWidth
              options={discountTypeOptions}
              getOptionLabel={option => option.label}
              disableClearable={true}
              value={discountTypeOptions.find(opt => opt.value === form.discountType) ?? discountTypeOptions[0]}
              onChange={(_e, newValue) => {
                update('discountType', newValue.value);
                update('discountAmount', 0);
                update('discountRate', 0);
                update('discountName', '');
                setErrors({
                  discountAmount: false,
                  discountRate: false
                });
              }}
              renderInput={params => <TextField {...params} label={t('invoices.type')} required />}
              freeSolo={false}
            />
          </Grid>
          {form.discountType === DiscountType.fixed && (
            <Grid size={{ xs: 12, md: 12 }}>
              <AmountInput
                required={true}
                amountFormat={storeSettings?.amountFormat}
                label={t('invoices.fixed')}
                value={form.discountAmount}
                error={errors.discountAmount}
                helperText={errors.discountAmount ? t('common.fieldRequired') : ''}
                onChange={e => {
                  update('discountAmount', e);
                  validateField('discountAmount', (e ?? '').toString());
                }}
              />
            </Grid>
          )}
          {form.discountType === DiscountType.percentage && (
            <Grid size={{ xs: 12, md: 12 }}>
              <AmountInput
                required={true}
                max={100}
                label={t('invoices.percentage')}
                value={form.discountRate}
                error={errors.discountRate}
                helperText={errors.discountRate ? t('common.fieldRequired') : ''}
                onChange={e => {
                  update('discountRate', e);
                  validateField('discountRate', (e ?? '').toString());
                }}
              />
            </Grid>
          )}
          {(form.discountType === DiscountType.fixed || form.discountType === DiscountType.percentage) && (
            <Grid size={{ xs: 12, md: 12 }}>
              <TextField
                label={t('common.name')}
                fullWidth
                value={form.discountName}
                onChange={e => {
                  update('discountName', e.target.value);
                }}
              />
            </Grid>
          )}
        </Grid>
      </SwipeableDrawer>
    </>
  );
};
export const DiscountDropdown = memo(DiscountDropdownComponent);
