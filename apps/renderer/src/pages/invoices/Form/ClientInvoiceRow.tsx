import type { InvoiceFromData } from '../../../shared/types/formData';
import { Box } from '@mui/material';
import { memo, type FC } from 'react';
import type { InvoiceType } from '@invoice-builder/contracts';
import { ClientSelector } from './ClientSelector';
import { InvoiceInformationSelector } from './InvoiceInformationSelector';

interface Props {
  invoiceForm?: InvoiceFromData;
  onEditClients: () => void;
  onEditInvoiceInfo: () => void;
  type: InvoiceType;
}
const ClientInvoiceRowComponent: FC<Props> = ({ invoiceForm, onEditClients, onEditInvoiceInfo, type }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
      <ClientSelector onEdit={onEditClients} clientName={invoiceForm?.invoiceClientSnapshot?.clientName} />

      <InvoiceInformationSelector onEdit={onEditInvoiceInfo} type={type} invoiceForm={invoiceForm} />
    </Box>
  );
};
export const ClientInvoiceRow = memo(ClientInvoiceRowComponent);
