import type { InvoiceAdd, Settings } from '@invoice-builder/contracts';

export type InvoicePdfData = InvoiceAdd & { id?: number };
export type PdfSettings = Pick<Settings, 'amountFormat' | 'dateFormat'>;

export interface PdfTexts {
  billTo: string;
  invoiceNo: string;
  quoteNo: string;
  date: string;
  dueDate: string;
  customerNote: string;
  termsConditions: string;
  of: string;
  page: string;
  paymentInfo: string;
  pdfINVOICE: string;
  pdfQUOTE: string;
  subTotalLabel: string;
  discountLabel: string;
  surchargeLabel: string;
  incLabel: string;
  taxLabel: string;
  taxExclusivePerItemLabel: string;
  taxInclusivePerItemLabel: string;
  shippingFeeLabel: string;
  totalLabel: string;
  paidLabel: string;
  balanceDueLabel: string;
  itemLabel: string;
  unitLabel: string;
  qtyLabel: string;
  unitCostLabel: string;
  authorisedSignatoryLabel: string;
}

export interface AttachmentURL {
  id: number;
  url: string;
}

export interface InvoicesByCurrencyMeta {
  currencyCode: string;
  currencySymbol: string;
  totalAmount: number;
  totalAmountPaid: number;
  balanceDue: number;
  invoiceCount: number;
  overdueCount: number;
  collectionRate: number;
  avgPerInvoice: number;
  issuedAt: string;
  paidAt?: string;
  currencyId: number;
}

export interface InvoicesByCurrency {
  [currencyCode: string]: InvoicesByCurrencyMeta;
}

/** Fully resolved, renderer-independent data consumed by the PDF presentation layer. */
export interface InvoicePdfInput {
  invoiceForm: InvoicePdfData;
  storeSettings: PdfSettings;
  logoUrl?: string;
  qrCodeUrl?: string;
  signatureUrl?: string;
  watermarkUrl?: string;
  watermarkPaidUrl?: string;
  attachmentUrls: AttachmentURL[];
  pdfTexts: PdfTexts;
  layoutRequired: string;
}
