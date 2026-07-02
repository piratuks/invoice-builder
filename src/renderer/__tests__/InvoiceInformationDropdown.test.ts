import { shouldAutoFillInvoiceNumber } from '../pages/invoices/Form/Dropdowns/InvoiceInformationDropdown';

describe('shouldAutoFillInvoiceNumber', () => {
  it('returns true when invoice number is empty and a sequence is provided', () => {
    expect(shouldAutoFillInvoiceNumber('', '000006')).toBe(true);
  });

  it('returns false when user has manually entered an invoice number', () => {
    expect(shouldAutoFillInvoiceNumber('MANUAL-42', '000006')).toBe(false);
  });

  it('returns false when sequence is not available', () => {
    expect(shouldAutoFillInvoiceNumber('', undefined)).toBe(false);
  });

  it('returns false when current value already matches next sequence', () => {
    expect(shouldAutoFillInvoiceNumber('000006', '000006')).toBe(false);
  });
});
