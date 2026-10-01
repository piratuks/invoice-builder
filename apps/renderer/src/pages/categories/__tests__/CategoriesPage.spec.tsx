import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { categoriesApi } from '../../../shared/api/categoriesApi';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { CategoriesPage } from '../index';

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
      <MemoryRouter initialEntries={['/categories']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('CategoriesPage', () => {
  const mockApi = {
    getAllCategories: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    addBatchCategory: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch(categoriesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no categories', async () => {
    mockApi.getAllCategories.mockResolvedValue({ success: true, data: [] });
    render(<CategoriesPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllCategories).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('categories.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved categories', async () => {
    mockApi.getAllCategories.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Goods', isArchived: false }]
    });
    render(<CategoriesPage />, { wrapper });

    expect(await screen.findByText('Goods')).toBeInTheDocument();
  });
});
