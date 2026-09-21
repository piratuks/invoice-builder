import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { NewActionDropdown } from '../Dropdowns/NewActionDropdown';

const mockUsePresetsRetrieve = vi.fn();

type UsePresetsRetrieveArgs = Parameters<
  typeof import('../../../shared/hooks/presets/usePresetsRetrieve').usePresetsRetrieve
>;

vi.mock('../../../shared/hooks/presets/usePresetsRetrieve', () => ({
  usePresetsRetrieve: (...args: UsePresetsRetrieveArgs) => mockUsePresetsRetrieve(...args)
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/invoices']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('NewActionDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePresetsRetrieve.mockReturnValue({
      presets: [
        { id: 1, name: 'Starter', isArchived: false, createdAt: '', updatedAt: '' },
        { id: 2, name: 'Annual', isArchived: false, createdAt: '', updatedAt: '' }
      ]
    });
  });

  it('renders the create-new option and preset actions', () => {
    render(<NewActionDropdown isOpen={true} onNew={vi.fn()} onNewFromPreset={vi.fn()} />, { wrapper });

    expect(screen.getByText(i18n.t('common.createNew'))).toBeInTheDocument();
    expect(screen.getByText(/Starter/i)).toBeInTheDocument();
    expect(screen.getByText(/Annual/i)).toBeInTheDocument();
  });

  it('calls the preset callback when a preset is selected', async () => {
    const user = userEvent.setup();
    const onNewFromPreset = vi.fn();

    render(<NewActionDropdown isOpen={true} onNew={vi.fn()} onNewFromPreset={onNewFromPreset} />, { wrapper });

    await user.click(screen.getByText(/Starter/i));

    expect(onNewFromPreset).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Starter' }));
  });
});
