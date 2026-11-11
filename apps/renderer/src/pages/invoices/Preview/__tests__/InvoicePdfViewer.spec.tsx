import { InvoiceType } from '@invoice-builder/contracts';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../../i18n';
import type { PdfTexts } from '../../../../shared/types/invoice';
import { InvoicePdfViewer } from '../InvoicePdfViewer';
import { PDFDocument } from '../PDFDocument';
import { renderPdfDocument } from '../renderPdfDocument';

vi.mock('@react-pdf/renderer', () => ({
  PDFViewer: ({ children }: { children: ReactNode }) => <div data-testid="standard-pdf-viewer">{children}</div>
}));

vi.mock('../PDFDocument', () => ({
  PDFDocument: () => null
}));

vi.mock('../renderPdfDocument', () => ({
  renderPdfDocument: vi.fn()
}));

const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;

const makeDocument = (enabled: boolean | undefined) => (
  <PDFDocument
    invoiceForm={{
      invoiceType: InvoiceType.invoice,
      invoiceCustomization: {
        showItemDescriptions: enabled,
        fieldSortOrders: {
          no: 0,
          item: 1,
          unit: 2,
          quantity: 3,
          unitCost: 4,
          total: 5
        }
      },
      invoiceItems: [
        {
          itemId: 1,
          quantity: '1',
          taxRate: 0,
          invoiceItemSnapshot: {
            parentInvoiceItemId: 1,
            itemName: 'Consulting',
            itemDescription: 'Description',
            unitPriceCents: '1000'
          }
        }
      ]
    }}
    attachmentUrls={[]}
    pdfTexts={{} as PdfTexts}
    layoutRequired="Layout required"
  />
);

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe('InvoicePdfViewer', () => {
  beforeEach(() => {
    vi.mocked(renderPdfDocument).mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:measured-pdf');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it.each([undefined, false])('keeps the standard viewer when visibility is %j', enabled => {
    render(<InvoicePdfViewer>{makeDocument(enabled)}</InvoicePdfViewer>, { wrapper });

    expect(screen.getByTestId('standard-pdf-viewer')).toBeInTheDocument();
    expect(renderPdfDocument).not.toHaveBeenCalled();
  });

  it('shows the generated PDF and releases its URL on unmount', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    vi.mocked(renderPdfDocument).mockResolvedValue(blob);

    const { unmount } = render(<InvoicePdfViewer>{makeDocument(true)}</InvoicePdfViewer>, { wrapper });

    const preview = await screen.findByTitle(i18n.t('ariaLabel.preview'));

    expect(preview).toHaveAttribute('src', 'blob:measured-pdf#toolbar=0');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:measured-pdf');
  });

  it('ignores a pending result after descriptions are disabled', async () => {
    let resolveRender!: (blob: Blob) => void;

    vi.mocked(renderPdfDocument).mockReturnValue(
      new Promise<Blob>(resolve => {
        resolveRender = resolve;
      })
    );

    const { rerender } = render(<InvoicePdfViewer>{makeDocument(true)}</InvoicePdfViewer>, { wrapper });

    await waitFor(() => expect(renderPdfDocument).toHaveBeenCalledTimes(1));

    rerender(<InvoicePdfViewer>{makeDocument(false)}</InvoicePdfViewer>);

    await act(async () => {
      resolveRender(new Blob(['outdated-pdf']));
    });

    expect(screen.getByTestId('standard-pdf-viewer')).toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('shows a rendering error', async () => {
    vi.mocked(renderPdfDocument).mockRejectedValue(new Error('Unable to generate this PDF.'));

    render(<InvoicePdfViewer>{makeDocument(true)}</InvoicePdfViewer>, { wrapper });

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to generate this PDF.');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('shows loading initially and while regenerating the preview', async () => {
    let resolveRender!: (blob: Blob) => void;

    vi.mocked(renderPdfDocument).mockImplementation(
      () =>
        new Promise<Blob>(resolve => {
          resolveRender = resolve;
        })
    );

    const { rerender } = render(<InvoicePdfViewer>{makeDocument(true)}</InvoicePdfViewer>, { wrapper });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTitle(i18n.t('ariaLabel.preview'))).not.toBeInTheDocument();

    await act(async () => {
      resolveRender(new Blob(['first-pdf'], { type: 'application/pdf' }));
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByTitle(i18n.t('ariaLabel.preview'))).toBeInTheDocument();

    rerender(<InvoicePdfViewer>{makeDocument(true)}</InvoicePdfViewer>);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTitle(i18n.t('ariaLabel.preview'))).not.toBeInTheDocument();

    await act(async () => {
      resolveRender(new Blob(['updated-pdf'], { type: 'application/pdf' }));
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByTitle(i18n.t('ariaLabel.preview'))).toBeInTheDocument();
  });
});
