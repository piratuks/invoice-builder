import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Autocomplete,
  Box,
  Dialog,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Tooltip
} from '@mui/material';
import { memo, useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../i18n';
import { AmountInput } from '../../../../shared/components/inputs/amountInput/AmountInput';
import { ModalAppBar } from '../../../../shared/components/layout/modalAppBar/ModalAppBar';
import { Alignment } from '../../../../shared/enums/alignment';
import type { InvoiceType } from '../../../../shared/enums/invoiceType';
import { useForm } from '../../../../shared/hooks/form/useForm';
import { useHeadersRetrieve } from '../../../../shared/hooks/invoices/useHeadersRetrieve';
import type { CustomField, CustomFieldMeta, ItemForm } from '../../../../shared/types/invoice';
import type { Response } from '../../../../shared/types/response';
import { validators } from '../../../../shared/utils/validatorFunctions';
import { useAppDispatch, useAppSelector } from '../../../../state/configureStore';
import { addToast, selectSettings } from '../../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  type: InvoiceType;
  headerOptions: CustomFieldMeta[];
  currQuantity?: string;
  currUnitPrice?: number;
  customField?: CustomField;
  onCancel?: () => void;
  onSave?: (data: ItemForm) => void;
}
const ItemMetadataSetterComponent: FC<Props> = ({
  isOpen,
  type,
  headerOptions,
  currQuantity,
  currUnitPrice,
  customField,
  onCancel = () => {},
  onSave = () => {}
}) => {
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);
  const [isFormValid, setIsFormValid] = useState(true);
  const { form, setForm, update } = useForm<ItemForm>({
    quantity: Number(currQuantity ?? 1),
    header: customField?.header ?? undefined,
    value: customField?.value ?? undefined,
    sortOrder: customField?.sortOrder ?? undefined,
    alignment: customField?.alignment ?? undefined,
    unitPrice: Number(currUnitPrice ?? 0)
  });
  const [errors, setErrors] = useState({
    quantity: false,
    unitPrice: false,
    header: false,
    sortOrder: false,
    value: false,
    alignment: false
  });
  const [touched, setTouched] = useState({
    header: false,
    sortOrder: false,
    value: false,
    alignment: false
  });

  const dispatch = useAppDispatch();
  const [customHeaders, setCustomHeaders] = useState<CustomFieldMeta[]>([]);
  const { execute: retrieveHeaders } = useHeadersRetrieve({
    type: type,
    immediate: false,
    onDone: (data: Response<CustomFieldMeta[]>) => {
      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }

      const unique = [...new Map([...headerOptions, ...(data.data ?? [])].map(h => [h.header, h])).values()];

      setCustomHeaders(unique);
    }
  });

  const isAnyMetadataPresent = useCallback(() => {
    return (
      (form.header !== undefined && form.header !== '') ||
      (form.value !== undefined && form.value !== '') ||
      form.sortOrder !== undefined ||
      form.alignment !== undefined
    );
  }, [form]);

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && (field === 'quantity' || field === 'unitPrice')) {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useEffect(() => {
    const metadataRequired = isAnyMetadataPresent();

    if (!metadataRequired) {
      setErrors(e => ({ ...e, header: false, value: false, sortOrder: false, alignment: false }));
      return;
    }

    const headerStr = form.header ?? '';
    const valueStr = form.value ?? '';
    const sortOrderStr = form.sortOrder != undefined ? String(form.sortOrder) : '';
    const alignmentStr = form.alignment ?? '';

    setErrors(e => ({
      ...e,
      header: touched.header ? !validators.required(headerStr) : false,
      value: touched.value ? !validators.required(valueStr) : false,
      sortOrder: touched.sortOrder ? !validators.required(sortOrderStr) : false,
      alignment: touched.alignment ? !validators.required(alignmentStr) : false
    }));
  }, [isAnyMetadataPresent, form, touched]);

  useEffect(() => {
    if (isOpen) retrieveHeaders();
  }, [isOpen, retrieveHeaders]);

  useEffect(() => {
    const valid = (() => {
      if (form.quantity === undefined) return false;
      if (form.unitPrice === undefined) return false;

      const header = form.header;
      const value = form.value;
      const sortOrder = form.sortOrder;
      const alignment = form.alignment;

      const bothEmpty =
        (header === undefined || header === '') &&
        (value === undefined || value === '') &&
        sortOrder === undefined &&
        alignment === undefined;

      const bothFilled =
        typeof header === 'string' &&
        header.trim() !== '' &&
        typeof value === 'string' &&
        value.trim() !== '' &&
        sortOrder != undefined &&
        alignment != undefined;

      return bothEmpty || bothFilled;
    })();

    setIsFormValid(valid);
  }, [form]);

  useEffect(() => {
    if (isOpen)
      setForm({
        quantity: Number(currQuantity ?? 1),
        header: customField?.header ?? undefined,
        value: customField?.value ?? undefined,
        sortOrder: customField?.sortOrder ?? undefined,
        alignment: customField?.alignment ?? undefined,
        unitPrice: Number(currUnitPrice ?? 0)
      });
  }, [currQuantity, currUnitPrice, customField, isOpen, setForm]);

  useEffect(() => {
    if (isOpen) {
      setTouched({ header: false, sortOrder: false, value: false, alignment: false });
      setErrors(e => ({ ...e, header: false, value: false, sortOrder: false, alignment: false }));
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <ModalAppBar
        title={t('invoices.addItem')}
        description={t('common.fieldRequired')}
        isFormValid={isFormValid}
        formData={form}
        onClose={onCancel}
        onSave={data => {
          onSave(data as ItemForm);
          setErrors({
            unitPrice: false,
            quantity: false,
            header: false,
            sortOrder: false,
            value: false,
            alignment: false
          });
        }}
      />
      <DialogContent sx={{ minWidth: '300px' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <AmountInput
              required={true}
              label={t('invoices.quantity')}
              value={form.quantity}
              error={errors.quantity}
              helperText={errors.quantity ? t('common.fieldRequired') : ''}
              decimalScale={3}
              onChange={e => {
                update('quantity', e);
                validateField('quantity', e != undefined ? e.toString() : '');
              }}
            />
          </Grid>
          {storeSettings && (
            <Grid size={{ xs: 12, md: 6 }}>
              <AmountInput
                required={true}
                amountFormat={storeSettings?.amountFormat}
                label={t('common.amount')}
                value={form.unitPrice}
                error={errors.unitPrice}
                helperText={errors.unitPrice ? t('common.fieldRequired') : ''}
                onChange={e => {
                  update('unitPrice', e);
                  validateField('unitPrice', (e ?? '').toString());
                }}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              freeSolo
              options={customHeaders.map(item => item.header)}
              value={form.header ?? ''}
              renderInput={params => (
                <TextField
                  {...params}
                  error={errors.header}
                  helperText={errors.header ? t('common.fieldRequired') : ''}
                  placeholder={t('invoices.customFieldHeaderPlaceholder')}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {t('invoices.customFieldHeader')}
                      {isAnyMetadataPresent() && ' *'}
                      <Tooltip title={t('invoices.customFieldHeaderTooltip')}>
                        <InfoOutlinedIcon fontSize="small" sx={{ color: 'action.active', cursor: 'pointer' }} />
                      </Tooltip>
                    </Box>
                  }
                  variant="outlined"
                />
              )}
              onChange={(_e, newValue) => {
                update('header', newValue ?? '');
                setTouched(s => ({ ...s, header: true }));

                const specific = customHeaders.find(item => item.header === newValue);
                if (specific) {
                  update('sortOrder', specific.sortOrder);
                  update('alignment', specific.alignment);
                  setTouched(s => ({ ...s, alignment: true, sortOrder: true }));
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t('invoices.customFieldValue')}
              fullWidth
              value={form.value ?? ''}
              error={errors.value}
              helperText={errors.value ? t('common.fieldRequired') : ''}
              required={isAnyMetadataPresent()}
              onChange={e => {
                update('value', e.target.value);
                setTouched(s => ({ ...s, value: true }));
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AmountInput
              required={isAnyMetadataPresent()}
              label={t('invoices.sortOrder')}
              value={form.sortOrder}
              error={errors.sortOrder}
              helperText={errors.sortOrder ? t('common.fieldRequired') : ''}
              onChange={e => {
                update('sortOrder', e);
                setTouched(s => ({ ...s, sortOrder: true }));
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl component="fieldset" error={errors.alignment}>
              <FormLabel component="legend" required={isAnyMetadataPresent()}>
                {t('invoices.customFieldAlignment')}
              </FormLabel>
              <RadioGroup
                row
                value={form.alignment ?? ''}
                onChange={(_e, newValue) => {
                  if (form.alignment === newValue) {
                    update('alignment', undefined);
                  } else {
                    update('alignment', newValue as Alignment);
                  }
                  setTouched(s => ({ ...s, alignment: true }));
                }}
              >
                <FormControlLabel
                  onClick={e => {
                    e.preventDefault();
                    if (form.alignment === Alignment.left) update('alignment', undefined);
                    else update('alignment', Alignment.left);
                    setTouched(s => ({ ...s, alignment: true }));
                  }}
                  value={Alignment.left}
                  control={<Radio />}
                  label={Alignment.left}
                />
                <FormControlLabel
                  onClick={e => {
                    e.preventDefault();
                    if (form.alignment === Alignment.center) update('alignment', undefined);
                    else update('alignment', Alignment.center);
                    setTouched(s => ({ ...s, alignment: true }));
                  }}
                  value={Alignment.center}
                  control={<Radio />}
                  label={Alignment.center}
                />
                <FormControlLabel
                  onClick={e => {
                    e.preventDefault();
                    if (form.alignment === Alignment.right) update('alignment', undefined);
                    else update('alignment', Alignment.right);
                    setTouched(s => ({ ...s, alignment: true }));
                  }}
                  value={Alignment.right}
                  control={<Radio />}
                  label={Alignment.right}
                />
              </RadioGroup>
              <FormHelperText>{errors.alignment ? t('common.fieldRequired') : ''}</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
export const ItemMetadataSetter = memo(ItemMetadataSetterComponent);
