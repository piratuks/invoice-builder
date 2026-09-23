import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { banksApi } from '../../../shared/api/banksApi';
import { businessesApi } from '../../../shared/api/businessesApi';
import { clientsApi } from '../../../shared/api/clientsApi';
import { currenciesApi } from '../../../shared/api/currenciesApi';
import { getApi } from '../../../shared/api/restApi';
import { styleProfilesApi } from '../../../shared/api/styleProfilesApi';
import type { Preset } from '../../../shared/types/preset';
import { store } from '../../../state/configureStore';
import { Form } from '../Form';

vi.mock('../../../shared/api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));
// jsdom has no real canvas 2d context; react-signature-canvas mounts one eagerly
vi.mock('react-signature-canvas', () => ({ default: () => <div data-testid="signature-canvas-stub" /> }));

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
      <ThemeProvider theme={testTheme}>
        <MemoryRouter initialEntries={['/presets']}>{children}</MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>
  </Provider>
);

const testTheme = createTheme({
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true
      }
    }
  }
});

describe('presets Form', () => {
  const mockApi = {
    getAllBanks: vi.fn(),
    getAllBusinesses: vi.fn(),
    getAllClients: vi.fn(),
    getAllCurrencies: vi.fn(),
    getAllStyleProfiles: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch(banksApi.util.resetApiState());
    store.dispatch(businessesApi.util.resetApiState());
    store.dispatch(clientsApi.util.resetApiState());
    store.dispatch(currenciesApi.util.resetApiState());
    store.dispatch(styleProfilesApi.util.resetApiState());
    Object.values(mockApi).forEach(fn => fn.mockResolvedValue({ success: true, data: [] }));
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('reports an invalid form when the required name field is empty', async () => {
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('becomes valid once a name is entered', async () => {
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('common.name') }), {
      target: { value: 'Core preset' }
    });

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ isFormValid: true, preset: expect.objectContaining({ name: 'Core preset' }) })
      )
    );
  });

  it('pre-fills the name field from an existing preset', () => {
    const preset: Preset = {
      id: 1,
      name: 'Existing preset',
      isArchived: false
    } as Preset;

    render(<Form preset={preset} />, { wrapper });

    expect(screen.getByRole('textbox', { name: i18n.t('common.name') })).toHaveValue('Existing preset');
  });

  it('toggles the archived switch', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(<Form handleChange={handleChange} />, { wrapper });

    const archivedSwitch = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(archivedSwitch).not.toBeChecked();

    await user.click(archivedSwitch);

    expect(archivedSwitch).toBeChecked();
  });

  it('selects a business from the businesses dropdown and updates the preset', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    mockApi.getAllBusinesses.mockResolvedValue({
      success: true,
      data: [{ id: 2, name: 'Acme Corp', shortName: 'AC', invoiceCount: 0, quotesCount: 0, isArchived: false }]
    });

    render(<Form handleChange={handleChange} />, { wrapper });

    await user.click(
      screen.getByText((_content, element) => element?.textContent?.trim().startsWith('BUSINESS') ?? false, {
        selector: 'div.MuiTypography-root'
      })
    );
    const businessEntry = await screen.findByText('Acme Corp');
    await user.click(businessEntry);

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: expect.objectContaining({ businessId: 2, businessName: 'Acme Corp' }) })
      )
    );
  });

  it('selects a currency from the currencies dropdown and updates the preset', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    mockApi.getAllCurrencies.mockResolvedValue({
      success: true,
      data: [{ id: 3, code: 'USD', symbol: '$', text: 'US Dollar', invoiceCount: 0, quotesCount: 0, isArchived: false }]
    });

    render(<Form handleChange={handleChange} />, { wrapper });

    await user.click(screen.getByText(new RegExp(`^${i18n.t('common.currency')}`, 'i')));
    const currencyEntry = await screen.findByText('US Dollar');
    await user.click(currencyEntry);

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: expect.objectContaining({ currencyId: 3, currencyCode: 'USD' }) })
      )
    );
  });
});
