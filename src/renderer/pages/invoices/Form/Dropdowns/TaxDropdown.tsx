import {
  Autocomplete,
  Box,
  FormControlLabel,
  Grid,
  SwipeableDrawer,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { memo, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AmountInput } from '../../../../shared/components/inputs/amountInput/AmountInput';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';
import { InvoiceTaxOptionType } from '../../../../shared/enums/invoiceTaxOptionType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../../../../shared/enums/taxType';
import { useForm } from '../../../../shared/hooks/form/useForm';
import type { TaxForm } from '../../../../shared/types/invoice';
import { validators } from '../../../../shared/utils/validatorFunctions';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: TaxForm) => void;
  data?: TaxForm;
}
const TaxDropdownComponent: FC<Props> = ({ isOpen, data, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();

  const [selectedOption, setSelectedOption] = useState<InvoiceTaxOptionType | undefined>(undefined);
  const taxTypeOptions = [
    { label: t('invoices.none'), value: undefined },
    { label: t('invoices.onTotal'), value: InvoiceTaxOptionType.onTotal },
    { label: t('invoices.deducted'), value: InvoiceTaxOptionType.deducted },
    { label: t('invoices.perItem'), value: InvoiceTaxOptionType.perItem }
  ];

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const { form, setForm, update } = useForm<TaxForm>({
    taxType: undefined,
    taxRate: 0,
    taxName: '',
    invoiceItems: []
  });

  const [errors, setErrors] = useState({
    taxRate: false
  });
  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && field === 'taxRate') {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setForm({
        taxType: data?.taxType,
        taxRate: data?.taxRate ?? 0,
        taxName: data?.taxName ?? '',
        invoiceItems: data?.invoiceItems ?? []
      });
      setErrors({
        taxRate: false
      });
      if (data?.taxType === InvoiceTaxType.exclusive || data?.taxType === InvoiceTaxType.inclusive) {
        setSelectedOption(InvoiceTaxOptionType.onTotal);
      } else if (data?.taxType === InvoiceTaxType.deducted) {
        setSelectedOption(InvoiceTaxOptionType.deducted);
      } else if (data?.invoiceItems.some(it => it.taxType)) {
        setSelectedOption(InvoiceTaxOptionType.perItem);
      } else {
        setSelectedOption(undefined);
      }
    }
  }, [isOpen, data, setForm]);

  useEffect(() => {
    const valid = typeof form.taxRate !== 'undefined' || !form.taxType;

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
              height: '50%',
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
            title={t('invoices.addTaxes')}
            showBack={false}
            showSave={true}
            showClose={false}
            formData={form}
            isFormValid={isFormValid}
            onClose={onClose}
            onSave={data => {
              onClick?.(data as TaxForm);
            }}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Autocomplete
              fullWidth
              options={taxTypeOptions}
              getOptionLabel={option => option.label}
              disableClearable={true}
              value={taxTypeOptions.find(opt => opt.value === selectedOption) ?? taxTypeOptions[0]}
              onChange={(_e, newValue) => {
                if (newValue.value === InvoiceTaxOptionType.onTotal) {
                  update('taxType', InvoiceTaxType.exclusive);
                } else if (newValue.value === InvoiceTaxOptionType.deducted) {
                  update('taxType', InvoiceTaxType.deducted);
                } else {
                  update('taxType', undefined);
                }
                setSelectedOption(newValue.value);
                update('taxRate', 0);
                update('taxName', '');
                setErrors({
                  taxRate: false
                });
                setForm(prev => ({
                  ...prev,
                  invoiceItems: prev.invoiceItems.map(it => ({
                    ...it,
                    taxRate: 0,
                    taxType: undefined
                  }))
                }));
              }}
              renderInput={params => <TextField {...params} label={t('invoices.type')} required />}
              freeSolo={false}
            />
          </Grid>
          {form.taxType && (
            <Grid size={{ xs: 12, md: 12 }}>
              <AmountInput
                required={true}
                max={100}
                label={t('invoices.percentage')}
                value={form.taxRate}
                decimalScale={3}
                error={errors.taxRate}
                helperText={errors.taxRate ? t('common.fieldRequired') : ''}
                onChange={e => {
                  update('taxRate', e);
                  validateField('taxRate', (e ?? '').toString());
                }}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 12 }}>
            <TextField
              label={t('common.name')}
              fullWidth
              value={form.taxName}
              onChange={e => {
                update('taxName', e.target.value);
              }}
            />
          </Grid>
          {(form.taxType === InvoiceTaxType.exclusive || form.taxType === InvoiceTaxType.inclusive) && (
            <Grid size={{ xs: 12, md: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.taxType === InvoiceTaxType.inclusive}
                    onChange={e => {
                      if (e.target.checked) update('taxType', InvoiceTaxType.inclusive);
                      else update('taxType', InvoiceTaxType.exclusive);
                    }}
                  />
                }
                label={t('invoices.inclusive')}
              />
            </Grid>
          )}
          {selectedOption === InvoiceTaxOptionType.perItem && (
            <Grid size={{ xs: 12, md: 12 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {form.invoiceItems.map((invoiceItem, index) => (
                  <Box
                    key={`invoice-item-${invoiceItem.itemId}-${index}`}
                    sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                  >
                    <Typography
                      component="div"
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        justifyContent: 'start',
                        flexDirection: 'row'
                      }}
                    >
                      {invoiceItem.invoiceItemSnapshot.itemName}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box
                      sx={{
                        width: '20%'
                      }}
                    >
                      <AmountInput
                        required={false}
                        max={100}
                        decimalScale={3}
                        label={'%'}
                        value={invoiceItem.taxRate}
                        onChange={(e?: number) => {
                          setForm(prev => ({
                            ...prev,
                            invoiceItems: prev.invoiceItems.map((it, i) =>
                              i === index
                                ? {
                                    ...it,
                                    taxRate: e ?? 0,
                                    taxType: form.invoiceItems.some(it => it.taxType === InvoiceItemTaxType.inclusive)
                                      ? InvoiceItemTaxType.inclusive
                                      : InvoiceItemTaxType.exclusive
                                  }
                                : it
                            )
                          }));
                        }}
                      />
                    </Box>
                  </Box>
                ))}
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.invoiceItems.some(it => it.taxType === InvoiceItemTaxType.inclusive)}
                      onChange={e => {
                        setForm(prev => ({
                          ...prev,
                          invoiceItems: prev.invoiceItems.map(it => ({
                            ...it,
                            taxType: e.target.checked ? InvoiceItemTaxType.inclusive : InvoiceItemTaxType.exclusive
                          }))
                        }));
                      }}
                    />
                  }
                  label={t('invoices.inclusive')}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </SwipeableDrawer>
    </>
  );
};
export const TaxDropdown = memo(TaxDropdownComponent);
