import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { banksApi } from '../../../shared/api/banksApi';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { BanksPage } from '../index';

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
      <MemoryRouter initialEntries={['/banks']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('BanksPage', () => {
  const mockApi = {
    getAllBanks: vi.fn(),
    addBank: vi.fn(),
    updateBank: vi.fn(),
    deleteBank: vi.fn(),
    addBatchBank: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch(banksApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no banks', async () => {
    mockApi.getAllBanks.mockResolvedValue({ success: true, data: [] });
    render(<BanksPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllBanks).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('banks.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved banks', async () => {
    mockApi.getAllBanks.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Bank A', bankName: 'Bank A Corp', invoiceCount: 0, quotesCount: 0, isArchived: false }]
    });
    render(<BanksPage />, { wrapper });

    expect(await screen.findByText('Bank A')).toBeInTheDocument();
  });
});
