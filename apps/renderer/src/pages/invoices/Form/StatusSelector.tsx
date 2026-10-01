import type { InvoiceFromData } from '../../../shared/types/formData';
import { Box, FormControlLabel, Switch, useMediaQuery, useTheme } from '@mui/material';
import { memo, useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceStatus, InvoiceType } from '@invoice-builder/contracts';
import { getBalanceDue, getPaidAmount } from '../../../shared/utils/invoiceFunctions';

interface Props {
  invoiceForm?: InvoiceFromData;
  onArchivedChanged: (value: boolean) => void;
  onStatusChanged: (status: InvoiceStatus) => void;
}
const StatusSelectorComponent: FC<Props> = ({ invoiceForm, onArchivedChanged, onStatusChanged }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const totalAmountPaid = useMemo(() => getPaidAmount(invoiceForm?.invoicePayments ?? []), [invoiceForm]);
  const balanceDue = useMemo(
    () =>
      getBalanceDue({
        taxRate: invoiceForm?.taxRate ?? 0,
        taxType: invoiceForm?.taxType,
        invoiceItems: invoiceForm?.invoiceItems ?? [],
        discountType: invoiceForm?.discountType,
        discountAmount: Number(invoiceForm?.discountAmountCents ?? 0),
        discountPercent: invoiceForm?.discountPercent,
        shippingFee: Number(invoiceForm?.shippingFeeCents ?? 0),
        invoicePayments: invoiceForm?.invoicePayments ?? []
      }),
    [invoiceForm]
  );

  const updateStatusOnUncheck = () => {
    if (invoiceForm?.invoiceType === InvoiceType.quotation) {
      return InvoiceStatus.open;
    }

    if (totalAmountPaid <= 0) return InvoiceStatus.unpaid;
    if (totalAmountPaid > 0 && balanceDue - totalAmountPaid > 0) return InvoiceStatus.partiallyPaid;
    if (totalAmountPaid > 0 && balanceDue - totalAmountPaid <= 0) return InvoiceStatus.paid;

    return InvoiceStatus.unpaid;
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          width: '100%',
          justifyContent: 'end',
          alignItems: 'end',
          gap: 1
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={invoiceForm?.status === InvoiceStatus.closed}
              onChange={e => {
                onStatusChanged(e.target.checked ? InvoiceStatus.closed : updateStatusOnUncheck());
              }}
            />
          }
          label={t('invoices.markAsClosed')}
        />
        {invoiceForm?.invoiceType === InvoiceType.invoice && (
          <FormControlLabel
            control={
              <Switch
                checked={invoiceForm?.status === InvoiceStatus.paid}
                onChange={e => {
                  onStatusChanged(e.target.checked ? InvoiceStatus.paid : updateStatusOnUncheck());
                }}
              />
            }
            label={t('invoices.markAsPaid')}
          />
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          width: '100%',
          justifyContent: 'end',
          alignItems: 'end',
          gap: 1
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={invoiceForm?.isArchived ?? false}
              onChange={e => {
                onArchivedChanged(e.target.checked);
              }}
            />
          }
          label={t('common.archived')}
        />
      </Box>
    </>
  );
};
export const StatusSelector = memo(StatusSelectorComponent);
