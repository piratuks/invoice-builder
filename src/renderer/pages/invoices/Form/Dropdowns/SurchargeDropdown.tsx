import { Autocomplete, Box, Grid, SwipeableDrawer, TextField, useMediaQuery, useTheme } from '@mui/material';
import { memo, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AmountInput } from '../../../../shared/components/inputs/amountInput/AmountInput';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';
import { DiscountType } from '../../../../shared/enums/discountType';
import { useForm } from '../../../../shared/hooks/form/useForm';
import type { SurchargeForm } from '../../../../shared/types/invoice';
import { validators } from '../../../../shared/utils/validatorFunctions';
import { useAppSelector } from '../../../../state/configureStore';
import { selectSettings } from '../../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: SurchargeForm) => void;
  data?: SurchargeForm;
}

const SurchargeDropdownComponent: FC<Props> = ({ isOpen, data, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();

  const surchargeTypeOptions = [
    { label: t('invoices.none'), value: undefined },
    { label: t('invoices.fixed'), value: DiscountType.fixed },
    { label: t('invoices.percentage'), value: DiscountType.percentage }
  ];

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const storeSettings = useAppSelector(selectSettings);

  const { form, setForm, update } = useForm<SurchargeForm>({
    surchargeAmount: data?.surchargeAmount ?? 0,
    surchargeName: data?.surchargeName ?? '',
    surchargeType: data?.surchargeType,
    surchargeRate: data?.surchargeRate ?? 0
  });
  const [errors, setErrors] = useState({
    surchargeAmount: false,
    surchargeRate: false
  });
  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && (field === 'surchargeAmount' || field === 'surchargeRate')) {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setForm({
        surchargeAmount: data?.surchargeAmount ?? 0,
        surchargeName: data?.surchargeName ?? '',
        surchargeType: data?.surchargeType,
        surchargeRate: data?.surchargeRate ?? 0
      });
      setErrors({
        surchargeAmount: false,
        surchargeRate: false
      });
    }
  }, [isOpen, data, setForm]);

  useEffect(() => {
    const valid =
      (form.surchargeType === DiscountType.fixed && typeof form.surchargeAmount !== 'undefined') ||
      (form.surchargeType === DiscountType.percentage && typeof form.surchargeRate !== 'undefined') ||
      !form.surchargeType;

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
            title={t('invoices.addSurcharge')}
            showBack={false}
            showSave={true}
            showClose={false}
            formData={form}
            isFormValid={isFormValid}
            onClose={onClose}
            onSave={data => {
              onClick?.(data as SurchargeForm);
            }}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Autocomplete
              fullWidth
              options={surchargeTypeOptions}
              getOptionLabel={option => option.label}
              disableClearable={true}
              value={surchargeTypeOptions.find(opt => opt.value === form.surchargeType) ?? surchargeTypeOptions[0]}
              onChange={(_e, newValue) => {
                update('surchargeType', newValue.value);
                update('surchargeAmount', 0);
                update('surchargeRate', 0);
                update('surchargeName', '');
                setErrors({
                  surchargeAmount: false,
                  surchargeRate: false
                });
              }}
              renderInput={params => <TextField {...params} label={t('invoices.type')} required />}
              freeSolo={false}
            />
          </Grid>
          {form.surchargeType === DiscountType.fixed && (
            <Grid size={{ xs: 12, md: 12 }}>
              <AmountInput
                required={true}
                amountFormat={storeSettings?.amountFormat}
                label={t('invoices.fixed')}
                value={form.surchargeAmount}
                error={errors.surchargeAmount}
                helperText={errors.surchargeAmount ? t('common.fieldRequired') : ''}
                onChange={e => {
                  update('surchargeAmount', e);
                  validateField('surchargeAmount', (e ?? '').toString());
                }}
              />
            </Grid>
          )}
          {form.surchargeType === DiscountType.percentage && (
            <Grid size={{ xs: 12, md: 12 }}>
              <AmountInput
                required={true}
                max={100}
                label={t('invoices.percentage')}
                value={form.surchargeRate}
                error={errors.surchargeRate}
                helperText={errors.surchargeRate ? t('common.fieldRequired') : ''}
                onChange={e => {
                  update('surchargeRate', e);
                  validateField('surchargeRate', (e ?? '').toString());
                }}
              />
            </Grid>
          )}
          {(form.surchargeType === DiscountType.fixed || form.surchargeType === DiscountType.percentage) && (
            <Grid size={{ xs: 12, md: 12 }}>
              <TextField
                label={t('common.name')}
                fullWidth
                value={form.surchargeName}
                onChange={e => {
                  update('surchargeName', e.target.value);
                }}
              />
            </Grid>
          )}
        </Grid>
      </SwipeableDrawer>
    </>
  );
};

export const SurchargeDropdown = memo(SurchargeDropdownComponent);
