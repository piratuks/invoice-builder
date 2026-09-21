import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { ItemsPage } from '../index';

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
      <MemoryRouter initialEntries={['/items']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('ItemsPage', () => {
  const mockApi = {
    getAllItems: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    addBatchItem: vi.fn(),
    getAllUnits: vi.fn(),
    getAllCategories: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockApi.getAllUnits.mockResolvedValue({ success: true, data: [] });
    mockApi.getAllCategories.mockResolvedValue({ success: true, data: [] });
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no items', async () => {
    mockApi.getAllItems.mockResolvedValue({ success: true, data: [] });
    render(<ItemsPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllItems).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('items.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved items', async () => {
    mockApi.getAllItems.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Paper A4', amount: 5, invoiceCount: 0, quotesCount: 0, isArchived: false }]
    });
    render(<ItemsPage />, { wrapper });

    expect(await screen.findByText('Paper A4')).toBeInTheDocument();
  });
});
