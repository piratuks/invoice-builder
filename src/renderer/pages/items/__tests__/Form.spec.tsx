import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { categoriesApi } from '../../../shared/api/categoriesApi';
import { getApi } from '../../../shared/api/restApi';
import { unitsApi } from '../../../shared/api/unitsApi';
import type { Item } from '../../../shared/types/item';
import { store } from '../../../state/configureStore';
import { Form } from '../Form';

vi.mock('../../../shared/api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('items Form', () => {
  const mockApi = {
    getAllUnits: vi.fn(),
    getAllCategories: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(categoriesApi.util.resetApiState());
    store.dispatch(unitsApi.util.resetApiState());
    mockApi.getAllUnits.mockResolvedValue({ success: true, data: [] });
    mockApi.getAllCategories.mockResolvedValue({ success: true, data: [] });
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('reports an invalid form when required fields are empty', async () => {
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('shows the loading cursor while categories are being fetched', async () => {
    let resolveCategories: (value: { success: true; data: never[] }) => void = () => {};
    mockApi.getAllCategories.mockReturnValue(
      new Promise(resolve => {
        resolveCategories = resolve;
      })
    );

    render(<Form />, { wrapper });

    await waitFor(() => expect(document.body.style.cursor).toBe('wait'));

    resolveCategories({ success: true, data: [] });

    await waitFor(() => expect(document.body.style.cursor).toBe('default'));
  });

  it('shows the loading cursor while units are being fetched', async () => {
    let resolveUnits: (value: { success: true; data: never[] }) => void = () => {};
    mockApi.getAllUnits.mockReturnValue(
      new Promise(resolve => {
        resolveUnits = resolve;
      })
    );

    render(<Form />, { wrapper });

    await waitFor(() => expect(document.body.style.cursor).toBe('wait'));

    resolveUnits({ success: true, data: [] });

    await waitFor(() => expect(document.body.style.cursor).toBe('default'));
  });

  it('becomes valid once name and amount are filled in', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'Paper A4');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.amount') }), '5');

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ isFormValid: true, item: expect.objectContaining({ name: 'Paper A4' }) })
      )
    );
  });

  it('pre-fills the form fields from an existing item', async () => {
    const item: Item = {
      id: 1,
      name: 'Existing Item',
      amount: '10',
      description: '',
      isArchived: false,
      invoiceCount: 0,
      quotesCount: 0
    } as Item;

    render(<Form item={item} />, { wrapper });

    expect(await screen.findByRole('textbox', { name: i18n.t('common.name') })).toHaveValue('Existing Item');
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

  it('shows a required error when the amount field is cleared', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    const amountInput = screen.getByRole('textbox', { name: i18n.t('common.amount') });
    await user.clear(amountInput);

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('dispatches error toasts when retrieving units or categories fails', async () => {
    mockApi.getAllUnits.mockResolvedValue({ success: false, message: 'Units failed' });
    mockApi.getAllCategories.mockResolvedValue({ success: false, key: 'common.invalidForm' });

    render(<Form />, { wrapper });

    await waitFor(() => {
      const messages = store.getState().pageSlice.toasts.map(toast => toast.message);
      expect(messages).toEqual(expect.arrayContaining(['Units failed', i18n.t('common.invalidForm')]));
    });
  });
});
