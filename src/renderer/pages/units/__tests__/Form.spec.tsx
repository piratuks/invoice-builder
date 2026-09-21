import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import type { Unit } from '../../../shared/types/unit';
import { store } from '../../../state/configureStore';
import { Form } from '../Form';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('units Form', () => {
  it('reports an invalid form when the required name field is empty', async () => {
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('becomes valid once a name is entered', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'pcs');

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ isFormValid: true, unit: expect.objectContaining({ name: 'pcs' }) })
      )
    );
  });

  it('pre-fills the form fields from an existing unit', () => {
    const unit: Unit = {
      id: 1,
      name: 'Existing Unit',
      isArchived: false,
      invoiceCount: 0,
      quotesCount: 0
    } as Unit;

    render(<Form unit={unit} />, { wrapper });

    expect(screen.getByRole('textbox', { name: i18n.t('common.name') })).toHaveValue('Existing Unit');
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
});
