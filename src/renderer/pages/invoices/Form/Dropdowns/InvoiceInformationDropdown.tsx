import { Box, Grid, SwipeableDrawer, TextField, useMediaQuery, useTheme } from '@mui/material';
import { memo, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../i18n';
import { Datepicker } from '../../../../shared/components/inputs/datepicker/Datepicker';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';
import { InvoiceType } from '../../../../shared/enums/invoiceType';
import { useForm } from '../../../../shared/hooks/form/useForm';
import { useGetNextSequence } from '../../../../shared/hooks/invoices/useGetNextSequence';
import type { InvoiceInfo, NextSequenceData } from '../../../../shared/types/invoice';
import type { Response } from '../../../../shared/types/response';
import { validators } from '../../../../shared/utils/validatorFunctions';
import { useAppDispatch, useAppSelector } from '../../../../state/configureStore';
import { addToast, selectSettings } from '../../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  information: InvoiceInfo;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: InvoiceInfo) => void;
}

export const shouldAutoFillInvoiceNumber = (
  currentInvoiceNumber: string | undefined,
  nextSequence: string | undefined
): nextSequence is string => {
  return (
    nextSequence != undefined &&
    (currentInvoiceNumber == undefined || currentInvoiceNumber === '') &&
    currentInvoiceNumber !== nextSequence
  );
};

const InvoiceInformationDropdownComponent: FC<Props> = ({ isOpen, onClose, onOpen, onClick, information }) => {
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { form, setForm, update } = useForm<InvoiceInfo>({
    issuedAt: information?.issuedAt ?? new Date().toISOString(),
    invoiceNumber: information?.invoiceNumber ?? '',
    dueDate: information?.dueDate ?? '',
    invoicePrefix: information.id ? (information?.invoicePrefix ?? '') : (storeSettings?.invoicePrefix ?? ''),
    invoiceSuffix: information.id ? (information?.invoiceSuffix ?? '') : (storeSettings?.invoiceSuffix ?? '')
  });
  const [errors, setErrors] = useState({
    issuedAt: false,
    invoiceNumber: false
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const dispatch = useAppDispatch();

  const { execute: retrieveSequence } = useGetNextSequence({
    seqData: {
      businessId: information.businessId ?? -1,
      clientId: information.clientId ?? -1,
      invoiceType: information.invoiceType ?? InvoiceType.invoice
    },
    immediate: false,
    onDone: (data: Response<NextSequenceData | undefined>) => {
      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }

      const nextSequence = data.data?.formattedSequence;

      if (shouldAutoFillInvoiceNumber(form.invoiceNumber, nextSequence)) {
        update('invoiceNumber', nextSequence);
        validateField('invoiceNumber', nextSequence);
      }
    }
  });

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && (field === 'invoiceNumber' || field === 'issuedAt')) {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useEffect(() => {
    if (form.invoiceNumber == undefined || form.invoiceNumber === '') {
      retrieveSequence();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [information.businessId, information.clientId]);

  useEffect(() => {
    setForm({
      issuedAt: information?.issuedAt ?? new Date().toISOString(),
      invoiceNumber: information?.invoiceNumber ?? '',
      dueDate: information?.dueDate,
      invoicePrefix: information.id ? (information?.invoicePrefix ?? '') : (storeSettings?.invoicePrefix ?? ''),
      invoiceSuffix: information.id ? (information?.invoiceSuffix ?? '') : (storeSettings?.invoiceSuffix ?? '')
    });
  }, [information, setForm, storeSettings]);

  useEffect(() => {
    const valid =
      typeof form.issuedAt !== 'undefined' &&
      form.issuedAt?.trim() !== '' &&
      !errors.issuedAt &&
      form.invoiceNumber?.trim() !== '' &&
      !errors.invoiceNumber;

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
              height: isDesktop ? '40%' : '80%',
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
            title={
              information.invoiceType === InvoiceType.quotation ? t('invoices.quoteInfo') : t('invoices.invoiceInfo')
            }
            showBack={false}
            showSave={true}
            formData={form}
            isFormValid={isFormValid}
            onSave={data => {
              onClick?.(data as InvoiceInfo);
            }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={
                information.invoiceType === InvoiceType.quotation ? t('common.quotePrefix') : t('common.invoicePrefix')
              }
              fullWidth
              value={form.invoicePrefix}
              onChange={e => {
                update('invoicePrefix', e.target.value);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={
                information.invoiceType === InvoiceType.quotation ? t('common.quoteNumber') : t('common.invoiceNumber')
              }
              fullWidth
              required
              value={form.invoiceNumber}
              error={errors.invoiceNumber}
              helperText={errors.invoiceNumber ? t('common.fieldRequired') : ''}
              onChange={e => {
                update('invoiceNumber', e.target.value);
                validateField('invoiceNumber', e.target.value);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={
                information.invoiceType === InvoiceType.quotation ? t('common.quoteSuffix') : t('common.invoiceSuffix')
              }
              fullWidth
              value={form.invoiceSuffix}
              onChange={e => {
                update('invoiceSuffix', e.target.value);
              }}
            />
          </Grid>

          {storeSettings && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Datepicker
                label={`${t('common.issuedAt')}`}
                error={errors.issuedAt}
                required={true}
                value={form.issuedAt}
                format={storeSettings.dateFormat}
                onChange={value => {
                  update('issuedAt', value);
                  validateField('issuedAt', value ?? '');
                }}
              />
            </Grid>
          )}
          {storeSettings && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Datepicker
                label={`${t('common.dueDate')}`}
                value={form.dueDate}
                format={storeSettings.dateFormat}
                onChange={value => {
                  update('dueDate', value);
                }}
              />
            </Grid>
          )}
        </Grid>
      </SwipeableDrawer>
    </>
  );
};

export const InvoiceInformationDropdown = memo(InvoiceInformationDropdownComponent);
