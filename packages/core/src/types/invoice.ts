import type {
  Invoice,
  InvoiceCustomization,
  InvoiceItem,
  InvoiceItemSnapshots,
  InvoiceLayoutSnapshots,
  InvoiceType
} from '@invoice-builder/contracts';
import type { Stored } from './stored';

export interface InvoiceSequence {
  id?: number;
  businessId?: number;
  clientId?: number;
  nextSequence: number;
  invoiceType: InvoiceType;
  createdAt?: string;
  updatedAt?: string;
}

export type InvoiceItemRow = Omit<Stored<InvoiceItem, 'customField'>, 'invoiceItemSnapshot'> & {
  invoiceItemSnapshot?: InvoiceItemSnapshots;
};
export type InvoiceCustomizationRow = Stored<InvoiceCustomization, 'fieldSortOrders' | 'pdfTexts'>;
export type InvoiceLayoutSnapshotRow = Stored<InvoiceLayoutSnapshots, 'layoutSchema'>;

export type InvoiceRow = Omit<Invoice, 'invoiceItems' | 'invoiceCustomization' | 'invoiceLayoutSnapshot'> & {
  invoiceItems: InvoiceItemRow[];
  invoiceCustomization?: InvoiceCustomizationRow;
  invoiceLayoutSnapshot?: InvoiceLayoutSnapshotRow;
};
