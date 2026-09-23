import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../../i18n';
import { banksApi } from '../../../../shared/api/banksApi';
import { businessesApi } from '../../../../shared/api/businessesApi';
import { clientsApi } from '../../../../shared/api/clientsApi';
import { currenciesApi } from '../../../../shared/api/currenciesApi';
import { itemsApi } from '../../../../shared/api/itemsApi';
import { getApi } from '../../../../shared/api/restApi';
import { styleProfilesApi } from '../../../../shared/api/styleProfilesApi';
import { AmountFormat } from '../../../../shared/enums/amountFormat';
import { DateFormat } from '../../../../shared/enums/dateFormat';
import { InvoiceType } from '../../../../shared/enums/invoiceType';
import { Language } from '../../../../shared/enums/language';
import type { InvoiceFromData } from '../../../../shared/types/invoice';
import { store } from '../../../../state/configureStore';
import { setSettings } from '../../../../state/pageSlice';
import { InvoiceForm } from '../index';

vi.mock('../../../../shared/api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));
vi.mock('react-signature-canvas', () => ({ default: () => <div data-testid="signature-canvas-stub" /> }));

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

const baseInvoiceForm: Partial<InvoiceFromData> = {
  id: 1,
  invoiceType: InvoiceType.invoice,
  businessId: 1,
  clientId: 1,
  currencyId: 1,
  layoutId: 1,
  issuedAt: new Date().toISOString(),
  invoiceNumber: '1',
  language: Language.en,
  invoiceItems: [],
  invoicePayments: [],
  discountAmountCents: '0',
  shippingFeeCents: '0',
  surchargeAmountCents: '0',
  taxRate: 0
};

describe('InvoiceForm', () => {
  const mockApi = {
    getAllBanks: vi.fn(),
    getAllBusinesses: vi.fn(),
    getAllStyleProfiles: vi.fn(),
    getAllCurrencies: vi.fn(),
    getAllClients: vi.fn(),
    getAllItems: vi.fn(),
    getCustomHeaders: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch(banksApi.util.resetApiState());
    store.dispatch(businessesApi.util.resetApiState());
    store.dispatch(clientsApi.util.resetApiState());
    store.dispatch(currenciesApi.util.resetApiState());
    store.dispatch(itemsApi.util.resetApiState());
    store.dispatch(styleProfilesApi.util.resetApiState());
    Object.values(mockApi).forEach(fn => fn.mockResolvedValue({ success: true, data: [] }));
    vi.mocked(getApi).mockReturnValue(mockApi as never);
    store.dispatch(
      setSettings({
        id: 1,
        language: Language.en,
        amountFormat: AmountFormat.enUS,
        dateFormat: DateFormat.MMddyyyy,
        isDarkMode: false,
        shouldIncludeYear: false,
        shouldIncludeMonth: false,
        shouldIncludeBusinessName: false,
        quotesON: true,
        styleProfilesON: false,
        ublON: false,
        xrechnungON: false,
        receiptPrintingOn: false,
        presetsON: false,
        reportsON: false,
        createdAt: '',
        updatedAt: ''
      })
    );
  });

  afterEach(() => {
    store.dispatch(banksApi.util.resetApiState());
    store.dispatch(businessesApi.util.resetApiState());
    store.dispatch(clientsApi.util.resetApiState());
    store.dispatch(currenciesApi.util.resetApiState());
    store.dispatch(itemsApi.util.resetApiState());
    store.dispatch(styleProfilesApi.util.resetApiState());
  });

  it('renders the invoice form without items and shows the add-item selector', async () => {
    render(<InvoiceForm invoiceForm={baseInvoiceForm as InvoiceFromData} type={InvoiceType.invoice} />, { wrapper });

    await waitFor(() => expect(mockApi.getAllBanks).toHaveBeenCalled());
    expect(await screen.findByText(new RegExp(i18n.t('invoices.addItem'), 'i'))).toBeInTheDocument();
  });

  it('renders the financial section once invoice items are present', async () => {
    const invoiceFormWithItems: Partial<InvoiceFromData> = {
      ...baseInvoiceForm,
      invoiceItems: [
        {
          id: 1,
          itemId: 1,
          quantity: '1',
          taxRate: 0,
          invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Item A', unitPriceCents: '100' }
        }
      ]
    };

    render(<InvoiceForm invoiceForm={invoiceFormWithItems as InvoiceFromData} type={InvoiceType.invoice} />, {
      wrapper
    });

    expect(await screen.findByText(i18n.t('invoices.subTotal'))).toBeInTheDocument();
  });

  it('selects an item from the items dropdown and adds it to the invoice', async () => {
    const user = userEvent.setup();
    mockApi.getAllItems.mockResolvedValue({
      success: true,
      data: [{ id: 5, name: 'Consulting', amount: '100', invoiceCount: 0, quotesCount: 0, isArchived: false }]
    });

    render(<InvoiceForm invoiceForm={baseInvoiceForm as InvoiceFromData} type={InvoiceType.invoice} />, { wrapper });

    await user.click(screen.getByText(new RegExp(i18n.t('invoices.addItem'), 'i')));
    const itemEntry = await screen.findByText('Consulting');
    await user.click(itemEntry);

    expect(await screen.findByRole('button', { name: i18n.t('common.save') })).toBeEnabled();
  });

  it('selects a business from the businesses dropdown and updates the snapshot', async () => {
    const user = userEvent.setup();
    mockApi.getAllBusinesses.mockResolvedValue({
      success: true,
      data: [{ id: 2, name: 'Acme Corp', shortName: 'AC', invoiceCount: 0, quotesCount: 0, isArchived: false }]
    });

    render(<InvoiceForm invoiceForm={baseInvoiceForm as InvoiceFromData} type={InvoiceType.invoice} />, { wrapper });

    await user.click(
      screen.getByText((_content, element) => element?.textContent?.trim().startsWith('BUSINESS') ?? false, {
        selector: 'div.MuiTypography-root'
      })
    );
    const businessEntry = await screen.findByText('Acme Corp');
    await user.click(businessEntry);

    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
  });
});
