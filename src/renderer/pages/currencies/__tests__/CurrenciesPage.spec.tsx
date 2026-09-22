import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { currenciesApi } from '../../../shared/api/currenciesApi';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { CurrenciesPage } from '../index';

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
      <MemoryRouter initialEntries={['/currencies']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('CurrenciesPage', () => {
  const mockApi = {
    getAllCurrencies: vi.fn(),
    addCurrency: vi.fn(),
    updateCurrency: vi.fn(),
    deleteCurrency: vi.fn(),
    addBatchCurrency: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch(currenciesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no currencies', async () => {
    mockApi.getAllCurrencies.mockResolvedValue({ success: true, data: [] });
    render(<CurrenciesPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllCurrencies).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('currencies.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved currencies', async () => {
    mockApi.getAllCurrencies.mockResolvedValue({
      success: true,
      data: [{ id: 1, text: 'United States Dollar', code: 'USD', symbol: '$', isArchived: false }]
    });
    render(<CurrenciesPage />, { wrapper });

    expect(await screen.findByText('United States Dollar')).toBeInTheDocument();
  });
});
