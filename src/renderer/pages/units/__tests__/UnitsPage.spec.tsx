import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import { unitsApi } from '../../../shared/api/unitsApi';
import { store } from '../../../state/configureStore';
import { UnitsPage } from '../index';

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
      <MemoryRouter initialEntries={['/units']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('UnitsPage', () => {
  const mockApi = {
    getAllUnits: vi.fn(),
    addUnit: vi.fn(),
    updateUnit: vi.fn(),
    deleteUnit: vi.fn(),
    addBatchUnit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch(unitsApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no units', async () => {
    mockApi.getAllUnits.mockResolvedValue({ success: true, data: [] });
    render(<UnitsPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllUnits).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('units.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved units', async () => {
    mockApi.getAllUnits.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'pcs', isArchived: false }]
    });
    render(<UnitsPage />, { wrapper });

    expect(await screen.findByText('pcs')).toBeInTheDocument();
  });
});
