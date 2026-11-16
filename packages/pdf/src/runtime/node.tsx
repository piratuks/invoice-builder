import './nodeFonts.js';
import { createElement } from 'react';
import { renderPdfDocument } from './renderPdfDocument.js';
import { InvoicePdfDocument } from '../components/document.js';
import type { InvoicePdfInput } from '../types.js';

export { InvoicePdfDocument } from '../components/document.js';
export type {
  AttachmentURL,
  InvoicePdfData,
  InvoicePdfInput,
  InvoicesByCurrency,
  InvoicesByCurrencyMeta,
  PdfSettings,
  PdfTexts
} from '../types.js';
export * from '../invoiceFunctions.js';
export {
  formatDate,
  formatAmount,
  getFormattedCurrency,
  getFormattedLabel,
  getFormattingMeta
} from '../formatFunctions.js';

export const renderInvoicePdf = async (input: InvoicePdfInput): Promise<Uint8Array> => {
  const blob = await renderPdfDocument(createElement(InvoicePdfDocument, { input }));
  return new Uint8Array(await blob.arrayBuffer());
};
