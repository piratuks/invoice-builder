import type { InvoiceFromData } from '../../types/formData';
import { parseISO } from 'date-fns';
import { useCallback } from 'react';
import { MONTH_NAMES } from '../../../state/constant';
import type { EInvoice, Settings } from '@invoice-builder/contracts';
import { InvoiceType } from '@invoice-builder/contracts';

export const getXMLFilename = (invoiceForm: InvoiceFromData, einvoice: EInvoice, storeSettings: Settings) => {
  const xmlType = `_${einvoice}`;
  const hasInvoicePart = invoiceForm.invoicePrefix || invoiceForm.invoiceNumber || invoiceForm.invoiceSuffix;
  const subTypeName = invoiceForm.invoiceType === InvoiceType.invoice ? 'Invoice' : 'Quote';
  const invoiceNumber = `${hasInvoicePart ? '_' : ''}${invoiceForm.invoicePrefix ?? ''}${invoiceForm.invoiceNumber ?? ''}${invoiceForm.invoiceSuffix ?? ''}`;
  const issuedAtDate = invoiceForm?.issuedAt ? parseISO(invoiceForm.issuedAt) : undefined;
  const year = issuedAtDate && storeSettings?.shouldIncludeYear ? `_${issuedAtDate.getFullYear()}` : '';
  const month = issuedAtDate && storeSettings?.shouldIncludeMonth ? `_${MONTH_NAMES[issuedAtDate.getMonth()]}` : '';
  const businessName = storeSettings?.shouldIncludeBusinessName
    ? `${invoiceForm?.invoiceBusinessSnapshot?.businessName ? invoiceForm?.invoiceBusinessSnapshot?.businessName.trim().replaceAll(' ', '_') + '_' : ''}`
    : '';

  return `${businessName}${subTypeName}${invoiceNumber}${year}${month}${xmlType}.xml`;
};

export const useExportXML = (data: { invoiceForm?: InvoiceFromData; storeSettings?: Settings }) => {
  const { invoiceForm, storeSettings } = data;

  const exportXML = useCallback(
    async (xml: Uint8Array, einvoice: EInvoice) => {
      if (!invoiceForm || !storeSettings) return;

      const blob = new Blob([new Uint8Array(xml)], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = getXMLFilename(invoiceForm, einvoice, storeSettings);
      a.click();

      URL.revokeObjectURL(url);
    },
    [invoiceForm, storeSettings]
  );

  return { exportXML };
};
