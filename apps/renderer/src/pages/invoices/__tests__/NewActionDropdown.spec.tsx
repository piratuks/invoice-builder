import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { presetsApi } from '../../../shared/api/presetsApi';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { NewActionDropdown } from '../Dropdowns/NewActionDropdown';

vi.mock('../../../shared/api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/invoices']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('NewActionDropdown', () => {
  const mockApi = {
    getAllPresets: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(presetsApi.util.resetApiState());
    mockApi.getAllPresets.mockResolvedValue({
      success: true,
      data: [
        { id: 1, name: 'Starter', isArchived: false, createdAt: '', updatedAt: '' },
        { id: 2, name: 'Annual', isArchived: false, createdAt: '', updatedAt: '' }
      ]
    });
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('renders the create-new option and preset actions', async () => {
    render(<NewActionDropdown isOpen={true} onNew={vi.fn()} onNewFromPreset={vi.fn()} />, { wrapper });

    expect(screen.getByText(i18n.t('common.createNew'))).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Starter/i)).toBeInTheDocument());
    expect(screen.getByText(/Annual/i)).toBeInTheDocument();
  });

  it('calls the preset callback when a preset is selected', async () => {
    const user = userEvent.setup();
    const onNewFromPreset = vi.fn();

    render(<NewActionDropdown isOpen={true} onNew={vi.fn()} onNewFromPreset={onNewFromPreset} />, { wrapper });

    await user.click(await screen.findByText(/Starter/i));

    expect(onNewFromPreset).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Starter' }));
  });
});
