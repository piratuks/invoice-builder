import { act, renderHook } from '@testing-library/react';
import { EInvoice } from '../../../enums/einvoice';
import { InvoiceType } from '../../../enums/invoiceType';
import type { InvoiceFromData } from '../../../types/invoice';
import type { Settings } from '../../../types/settings';
import { getXMLFilename, useExportXML } from '../useExportXML';

describe('getXMLFilename', () => {
  const settings = {
    shouldIncludeYear: true,
    shouldIncludeMonth: true,
    shouldIncludeBusinessName: true
  } as unknown as Settings;

  it('builds a filename including the e-invoice profile suffix', () => {
    const invoiceForm = {
      invoiceType: InvoiceType.invoice,
      invoiceNumber: '001',
      issuedAt: '2024-03-15',
      invoiceBusinessSnapshot: { businessName: 'Acme Co' }
    } as unknown as InvoiceFromData;

    expect(getXMLFilename(invoiceForm, EInvoice.ubl21, settings)).toBe('Acme_Co_Invoice_001_2024_March_ubl21.xml');
  });

  it('omits optional parts and uses Quote for quotations', () => {
    const invoiceForm = { invoiceType: InvoiceType.quotation } as unknown as InvoiceFromData;
    expect(getXMLFilename(invoiceForm, EInvoice.xrechnung, {} as unknown as Settings)).toBe('Quote_xrechnung.xml');
  });
});

describe('useExportXML', () => {
  const invoiceForm = { invoiceType: InvoiceType.invoice, invoiceNumber: '001' } as unknown as InvoiceFromData;
  const storeSettings = {} as unknown as Settings;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  it('does nothing when invoiceForm or storeSettings are missing', async () => {
    const { result } = renderHook(() => useExportXML({}));
    await act(async () => {
      await result.current.exportXML(new Uint8Array([1]), EInvoice.ubl21);
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('creates and downloads an XML blob', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { result } = renderHook(() => useExportXML({ invoiceForm, storeSettings }));

    await act(async () => {
      await result.current.exportXML(new Uint8Array([1, 2, 3]), EInvoice.ubl21);
    });

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    clickSpy.mockRestore();
  });
});
