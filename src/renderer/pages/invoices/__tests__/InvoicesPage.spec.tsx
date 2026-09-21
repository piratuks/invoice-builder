import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import type { Invoice } from '../../../shared/types/invoice';
import { store } from '../../../state/configureStore';
import { InvoicesPage } from '../index';

vi.mock('../../../shared/api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    (() => ({
      matches: true,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }));
  vi.spyOn(window, 'matchMedia').mockImplementation(
    query =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      }) as unknown as MediaQueryList
  );
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/invoices']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('InvoicesPage', () => {
  const mockApi = {
    getAllInvoices: vi.fn(),
    addInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
    duplicateInvoice: vi.fn(),
    getAllPresets: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockApi.getAllPresets.mockResolvedValue({ success: true, data: [] });
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no invoices', async () => {
    mockApi.getAllInvoices.mockResolvedValue({ success: true, data: [] });
    render(<InvoicesPage type={InvoiceType.invoice} />, { wrapper });

    await waitFor(() => expect(mockApi.getAllInvoices).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('invoices.noItemInvoice'))).toBeInTheDocument();
  });

  it('lists retrieved invoices', async () => {
    const invoice: Partial<Invoice> = {
      id: 1,
      invoiceNumber: 'INV-0001',
      invoiceFullNumber: 'INV-0001',
      invoiceType: InvoiceType.invoice,
      status: undefined,
      taxRate: 0,
      invoiceItems: [],
      discountAmountCents: '0',
      shippingFeeCents: '0',
      surchargeAmountCents: '0',
      invoicePayments: []
    };
    mockApi.getAllInvoices.mockResolvedValue({ success: true, data: [invoice] });
    render(<InvoicesPage type={InvoiceType.invoice} />, { wrapper });

    expect(await screen.findByText('INV-0001')).toBeInTheDocument();
  });

  it('shows the empty state for quotes with the quote-specific text', async () => {
    mockApi.getAllInvoices.mockResolvedValue({ success: true, data: [] });
    render(<InvoicesPage type={InvoiceType.quotation} />, { wrapper });

    expect(await screen.findByText(i18n.t('invoices.noItemQuote'))).toBeInTheDocument();
  });
});
