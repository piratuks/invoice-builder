import { InvoiceType } from '@invoice-builder/contracts';
import { InvoicesPage } from '../invoices';

export const QuotesPage = () => <InvoicesPage type={InvoiceType.quotation} />;
