import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { LayoutBuilderPreview } from '../LayoutBuilderPreview';

vi.mock('@react-pdf/renderer', () => ({
  PDFViewer: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-viewer">{children}</div>
}));

vi.mock('../../invoices/Preview/PDFDocument', () => ({
  PDFDocument: ({ invoiceForm }: { invoiceForm: Record<string, unknown> }) => (
    <div data-testid="pdf-document" data-invoice={JSON.stringify(invoiceForm)} />
  )
}));

vi.mock('../../../shared/hooks/pdf/usePdfTexts', () => ({
  usePdfTexts: () => ({ subtotal: 'Subtotal' })
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('LayoutBuilderPreview', () => {
  it('builds and passes a preview invoice to the PDF document', () => {
    render(<LayoutBuilderPreview schema={{ version: 1, sections: [] } as never} />, { wrapper });

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    const invoice = JSON.parse(screen.getByTestId('pdf-document').getAttribute('data-invoice') ?? '{}');
    expect(invoice.invoiceNumber).toBe('PREVIEW-1001');
    expect(invoice.invoiceItems).toHaveLength(2);
    expect(invoice.invoiceLayoutSnapshot.layoutSchema).toEqual({ version: 1, sections: [] });
  });
});
