import { describe, it, expect, vi } from 'vitest';
import type { InvoiceFromData } from '../../../../shared/types/formData';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { AmountFormat, DateFormat, InvoiceType, Language } from '@invoice-builder/contracts';

import { store } from '../../../../state/configureStore';
import { DEFAULT_TABLE_FIELD_SORT_ORDERS } from '../../../../state/constant';
import { setSettings } from '../../../../state/pageSlice';
import { PreviewCore } from '../PreviewCore';

const assetUrls = {
  logo: 'logo-url',
  watermark: 'watermark-url',
  watermarkPaid: 'paid-watermark-url',
  signature: 'signature-url',
  qrCode: 'qr-code-url'
};

vi.mock('@react-pdf/renderer', () => ({
  PDFViewer: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-viewer">{children}</div>
}));

vi.mock('@invoice-builder/pdf', () => ({
  InvoicePdfDocument: (props: Record<string, unknown>) => (
    <div data-testid="pdf-document" data-props={JSON.stringify(props)} />
  )
}));

vi.mock('../../../../shared/hooks/fileExport/useExportPdf', () => ({
  getAttachmentsUrl: vi.fn().mockResolvedValue([{ id: 1, url: 'attachment-url' }]),
  getLogoUrl: vi.fn().mockResolvedValue('logo-url'),
  getQRCodeUrls: vi.fn().mockResolvedValue('qr-code-url'),
  getSignatureUrls: vi.fn().mockResolvedValue('signature-url'),
  getWatermarkPaidUrl: vi.fn().mockResolvedValue('paid-watermark-url'),
  getWatermarkUrl: vi.fn().mockResolvedValue('watermark-url')
}));

vi.mock('../../../../shared/hooks/pdf/usePdfTexts', () => ({
  usePdfTexts: () => ({ subtotal: 'Subtotal' })
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const invoiceForm = {
  id: 1,
  invoiceType: InvoiceType.invoice,
  language: Language.en,
  invoiceCustomization: {
    labelUpperCase: false,
    fieldSortOrders: DEFAULT_TABLE_FIELD_SORT_ORDERS,
    pdfTexts: { title: 'Invoice' }
  }
} as InvoiceFromData;

describe('PreviewCore', () => {
  it('loads assets before rendering the PDF document', async () => {
    store.dispatch(setSettings({ amountFormat: AmountFormat.enUS, dateFormat: DateFormat.MMddyyyy } as never));
    render(<PreviewCore invoiceForm={invoiceForm} />, { wrapper });

    expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument());

    const props = JSON.parse(screen.getByTestId('pdf-document').getAttribute('data-props') ?? '{}');
    expect(props.input.logoUrl).toBe(assetUrls.logo);
    expect(props.input.watermarkUrl).toBe(assetUrls.watermark);
    expect(props.input.watermarkPaidUrl).toBe(assetUrls.watermarkPaid);
    expect(props.input.signatureUrl).toBe(assetUrls.signature);
    expect(props.input.qrCodeUrl).toBe(assetUrls.qrCode);
    expect(props.input.attachmentUrls).toEqual([{ id: 1, url: 'attachment-url' }]);
    expect(props.input.pdfTexts).toEqual({ subtotal: 'Subtotal', title: 'Invoice' });
  });
});
