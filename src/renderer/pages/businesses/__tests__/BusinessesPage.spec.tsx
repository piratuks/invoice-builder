import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { BusinessesPage } from '../index';

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
      <MemoryRouter initialEntries={['/businesses']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('BusinessesPage', () => {
  const mockApi = {
    getAllBusinesses: vi.fn(),
    addBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    deleteBusiness: vi.fn(),
    addBatchBusiness: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no businesses', async () => {
    mockApi.getAllBusinesses.mockResolvedValue({ success: true, data: [] });
    render(<BusinessesPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllBusinesses).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('businesses.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved businesses', async () => {
    mockApi.getAllBusinesses.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Acme Corp', shortName: 'AC', invoiceCount: 0, quotesCount: 0, isArchived: false }]
    });
    render(<BusinessesPage />, { wrapper });

    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
  });
});
