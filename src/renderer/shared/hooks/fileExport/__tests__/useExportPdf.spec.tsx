import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../i18n';
import { InvoiceType } from '../../../enums/invoiceType';
import type { InvoiceFromData } from '../../../types/invoice';
import type { Settings } from '../../../types/settings';
import {
  createPdfBlob,
  getAttachmentsUrl,
  getLogoUrl,
  getPDFFilename,
  getQRCodeUrls,
  getSignatureUrls,
  getWatermarkPaidUrl,
  getWatermarkUrl,
  useExportPdf
} from '../useExportPdf';

const fakeBlob = new Blob(['fake-pdf'], { type: 'application/pdf' });

vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn(() => ({ toBlob: () => Promise.resolve(fakeBlob) }))
}));

vi.mock('../../../../pages/invoices/Preview/PDFDocument', () => ({
  PDFDocument: () => null
}));

const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;

describe('getAttachmentsUrl', () => {
  it('returns an empty array when there are no attachments', async () => {
    expect(await getAttachmentsUrl(undefined)).toEqual([]);
    expect(await getAttachmentsUrl({ invoiceAttachments: [] } as unknown as InvoiceFromData)).toEqual([]);
  });

  it('converts attachment buffers into data URLs', async () => {
    const invoiceForm = {
      invoiceAttachments: [{ id: 1, data: new Uint8Array([1, 2, 3]), fileType: 'application/pdf' }]
    } as unknown as InvoiceFromData;

    const result = await getAttachmentsUrl(invoiceForm);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].url).toMatch(/^data:application\/pdf/);
  });

  it('leaves the url undefined when attachment data is missing', async () => {
    const invoiceForm = {
      invoiceAttachments: [{ id: 2, data: undefined }]
    } as unknown as InvoiceFromData;
    const result = await getAttachmentsUrl(invoiceForm);
    expect(result).toEqual([{ id: 2, url: undefined }]);
  });
});

describe('getSignatureUrls', () => {
  it('returns undefined when there is no invoice form or signature data', async () => {
    expect(await getSignatureUrls(undefined)).toBeUndefined();
    expect(await getSignatureUrls({} as InvoiceFromData)).toBeUndefined();
  });

  it('converts signature data into a data URL', async () => {
    const invoiceForm = {
      signatureData: new Uint8Array([1]),
      signatureType: 'image/png'
    } as unknown as InvoiceFromData;
    const result = await getSignatureUrls(invoiceForm);
    expect(result).toMatch(/^data:image\/png/);
  });
});

describe('getLogoUrl', () => {
  it('returns undefined without a business logo', async () => {
    expect(await getLogoUrl(undefined)).toBeUndefined();
    expect(await getLogoUrl({ invoiceBusinessSnapshot: {} } as unknown as InvoiceFromData)).toBeUndefined();
  });

  it('converts the business logo into a data URL', async () => {
    const invoiceForm = {
      invoiceBusinessSnapshot: { businessLogo: new Uint8Array([1]), businessFileType: 'image/png' }
    } as unknown as InvoiceFromData;
    expect(await getLogoUrl(invoiceForm)).toMatch(/^data:image\/png/);
  });
});

describe('getQRCodeUrls', () => {
  it('returns undefined without a bank qr code', async () => {
    expect(await getQRCodeUrls(undefined)).toBeUndefined();
    expect(await getQRCodeUrls({ invoiceBankSnapshot: {} } as unknown as InvoiceFromData)).toBeUndefined();
  });

  it('converts the qr code into a data URL', async () => {
    const invoiceForm = {
      invoiceBankSnapshot: { qrCode: new Uint8Array([1]), qrCodeFileType: 'image/png' }
    } as unknown as InvoiceFromData;
    expect(await getQRCodeUrls(invoiceForm)).toMatch(/^data:image\/png/);
  });
});

describe('getWatermarkUrl/getWatermarkPaidUrl', () => {
  it('returns undefined without watermark data', async () => {
    expect(await getWatermarkUrl(undefined)).toBeUndefined();
    expect(await getWatermarkPaidUrl(undefined)).toBeUndefined();
    expect(await getWatermarkUrl({ invoiceCustomization: {} } as unknown as InvoiceFromData)).toBeUndefined();
    expect(await getWatermarkPaidUrl({ invoiceCustomization: {} } as unknown as InvoiceFromData)).toBeUndefined();
  });

  it('converts watermark buffers into data URLs', async () => {
    const invoiceForm = {
      invoiceCustomization: {
        watermarkFileData: new Uint8Array([1]),
        watermarkFileType: 'image/png',
        paidWatermarkFileData: new Uint8Array([2]),
        paidWatermarkFileType: 'image/png'
      }
    } as unknown as InvoiceFromData;
    expect(await getWatermarkUrl(invoiceForm)).toMatch(/^data:image\/png/);
    expect(await getWatermarkPaidUrl(invoiceForm)).toMatch(/^data:image\/png/);
  });
});

describe('getPDFFilename', () => {
  const settings = {
    shouldIncludeYear: true,
    shouldIncludeMonth: true,
    shouldIncludeBusinessName: true
  } as unknown as Settings;

  it('builds a filename with business name, date parts and invoice number', () => {
    const invoiceForm = {
      invoiceType: InvoiceType.invoice,
      invoicePrefix: 'INV-',
      invoiceNumber: '001',
      issuedAt: '2024-03-15',
      invoiceBusinessSnapshot: { businessName: 'Acme Co' }
    } as unknown as InvoiceFromData;

    expect(getPDFFilename(invoiceForm, settings)).toBe('Acme_Co_Invoice_INV-001_2024_March.pdf');
  });

  it('uses Quote as the sub type name for quotations and omits optional parts', () => {
    const invoiceForm = { invoiceType: InvoiceType.quotation } as unknown as InvoiceFromData;
    const minimalSettings = {} as unknown as Settings;

    expect(getPDFFilename(invoiceForm, minimalSettings)).toBe('Quote.pdf');
  });
});

describe('createPdfBlob', () => {
  it('renders a PDF document blob using the resolved asset urls', async () => {
    const invoiceForm = { invoiceType: InvoiceType.invoice, invoiceItems: [] } as unknown as InvoiceFromData;
    const blob = await createPdfBlob(invoiceForm, {} as Settings, {} as never, 'Layout required');
    expect(blob).toBe(fakeBlob);
  });
});

describe('useExportPdf', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  it('does nothing when invoiceForm or storeSettings are missing', async () => {
    const { result } = renderHook(() => useExportPdf({}), { wrapper });
    await result.current.exportPdf();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('creates and downloads a PDF file', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const invoiceForm = {
      invoiceType: InvoiceType.invoice,
      invoiceNumber: '001',
      invoiceItems: []
    } as unknown as InvoiceFromData;
    const { result } = renderHook(() => useExportPdf({ invoiceForm, storeSettings: {} as Settings }), { wrapper });

    await waitFor(() => expect(result.current.exportPdf).toBeInstanceOf(Function));
    await result.current.exportPdf();

    expect(URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    clickSpy.mockRestore();
  });
});
