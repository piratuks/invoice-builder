import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import { styleProfilesApi } from '../../../shared/api/styleProfilesApi';
import { store } from '../../../state/configureStore';
import { StyleProfilesPage } from '../index';

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
      <MemoryRouter initialEntries={['/styleProfiles']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('StyleProfilesPage', () => {
  const mockApi = {
    getAllStyleProfiles: vi.fn(),
    addStyleProfile: vi.fn(),
    updateStyleProfile: vi.fn(),
    deleteStyleProfile: vi.fn(),
    addBatchStyleProfile: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch(styleProfilesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no style profiles', async () => {
    mockApi.getAllStyleProfiles.mockResolvedValue({ success: true, data: [] });
    render(<StyleProfilesPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllStyleProfiles).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('styleProfiles.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved style profiles', async () => {
    mockApi.getAllStyleProfiles.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Test Profile', invoiceCount: 0, quotesCount: 0, isArchived: false }]
    });
    render(<StyleProfilesPage />, { wrapper });

    expect(await screen.findByText('Test Profile')).toBeInTheDocument();
  });
});
