import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { PresetsPage } from '../index';

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
      <MemoryRouter initialEntries={['/presets']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('PresetsPage', () => {
  const mockApi = {
    getAllPresets: vi.fn(),
    addPreset: vi.fn(),
    updatePreset: vi.fn(),
    deletePreset: vi.fn(),
    addBatchPreset: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty state when there are no presets', async () => {
    mockApi.getAllPresets.mockResolvedValue({ success: true, data: [] });
    render(<PresetsPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllPresets).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('presets.noItem'))).toBeInTheDocument();
  });

  it('lists retrieved presets', async () => {
    mockApi.getAllPresets.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Core preset', isArchived: false }]
    });
    render(<PresetsPage />, { wrapper });

    expect(await screen.findByText('Core preset')).toBeInTheDocument();
  });
});
