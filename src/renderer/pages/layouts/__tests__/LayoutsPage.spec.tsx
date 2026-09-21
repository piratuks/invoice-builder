import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { LayoutsPage } from '../index';

vi.mock('../../../shared/api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));
// layouts/Form.tsx pulls in monaco-editor, which needs browser APIs jsdom doesn't implement
vi.mock('../Form', () => ({ Form: () => null }));

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
      <MemoryRouter initialEntries={['/layouts']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('LayoutsPage', () => {
  const mockApi = {
    getAllLayouts: vi.fn(),
    addLayout: vi.fn(),
    updateLayout: vi.fn(),
    deleteLayout: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no layouts', async () => {
    mockApi.getAllLayouts.mockResolvedValue({ success: true, data: [] });
    render(<LayoutsPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllLayouts).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('layouts.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved layouts', async () => {
    mockApi.getAllLayouts.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          schema: { meta: { name: 'Classic' } },
          invoiceCount: 0,
          quotesCount: 0,
          isArchived: false
        }
      ]
    });
    render(<LayoutsPage />, { wrapper });

    expect(await screen.findByText('Classic')).toBeInTheDocument();
  });
});
