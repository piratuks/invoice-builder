import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../i18n';
import { InvoiceType } from '../../../enums/invoiceType';
import type { InvoiceFromData } from '../../../types/invoice';
import type { Settings } from '../../../types/settings';
import { useExportPdfWithXml } from '../useExportPdfWithXml';

const fakePdfBlob = new Blob(['fake-pdf'], { type: 'application/pdf' });
const savedPdfBytes = new Uint8Array([9, 9, 9]);

vi.mock('../useExportPdf', () => ({
  createPdfBlob: vi.fn(() => Promise.resolve(fakePdfBlob)),
  getPDFFilename: vi.fn(() => 'Invoice_001.pdf')
}));

const attachMock = vi.fn();
const saveMock = vi.fn(() => Promise.resolve(savedPdfBytes));

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn(() =>
      Promise.resolve({
        attach: attachMock,
        save: saveMock
      })
    )
  }
}));

const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;

describe('useExportPdfWithXml', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  it('does nothing when invoiceForm or storeSettings are missing', async () => {
    const { result } = renderHook(() => useExportPdfWithXml({}), { wrapper });
    await act(async () => {
      await result.current.exportPdfWithXml(new Uint8Array([1]));
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('attaches the xml to the generated pdf and downloads it', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const invoiceForm = { invoiceType: InvoiceType.invoice, invoiceNumber: '001' } as unknown as InvoiceFromData;
    const storeSettings = {} as unknown as Settings;
    const { result } = renderHook(() => useExportPdfWithXml({ invoiceForm, storeSettings }), { wrapper });

    await waitFor(() => expect(result.current.exportPdfWithXml).toBeInstanceOf(Function));
    const xml = new Uint8Array([1, 2, 3]);
    await act(async () => {
      await result.current.exportPdfWithXml(xml);
    });

    expect(attachMock).toHaveBeenCalledWith(xml, 'ubl-invoice', { mimeType: 'application/xml' });
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    clickSpy.mockRestore();
  });
});
