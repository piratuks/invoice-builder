import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { ClientsPage } from '../index';

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
      <MemoryRouter initialEntries={['/clients']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('ClientsPage', () => {
  const mockApi = {
    getAllClients: vi.fn(),
    addClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
    addBatchClient: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no clients', async () => {
    mockApi.getAllClients.mockResolvedValue({ success: true, data: [] });
    render(<ClientsPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllClients).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('clients.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved clients', async () => {
    mockApi.getAllClients.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'John Doe', invoiceCount: 0, quotesCount: 0, isArchived: false }]
    });
    render(<ClientsPage />, { wrapper });

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });
});
