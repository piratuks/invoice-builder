import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import type { Client } from '../../../shared/types/client';
import { store } from '../../../state/configureStore';
import { Form } from '../Form';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('clients Form', () => {
  it('reports an invalid form when required name/shortName fields are empty', async () => {
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('becomes valid once name and shortName are entered', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'John Doe');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.shortName') }), 'JD');

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isFormValid: true,
          client: expect.objectContaining({ name: 'John Doe', shortName: 'JD' })
        })
      )
    );
  });

  it('shows a validation error for an invalid email and marks the form invalid', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'John Doe');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.shortName') }), 'JD');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.email') }), 'not-an-email');

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('pre-fills the form fields from an existing client', () => {
    const client: Client = {
      id: 1,
      name: 'Existing Client',
      shortName: 'EC',
      email: '',
      phone: '',
      code: '',
      address: '',
      vatCode: '',
      additional: '',
      description: '',
      peppolEndpointSchemeId: '',
      buyerReference: '',
      peppolEndpointId: '',
      countryCode: '',
      isArchived: false,
      invoiceCount: 0,
      quotesCount: 0
    } as Client;

    render(<Form client={client} />, { wrapper });

    expect(screen.getByRole('textbox', { name: i18n.t('common.name') })).toHaveValue('Existing Client');
    expect(screen.getByRole('textbox', { name: i18n.t('common.shortName') })).toHaveValue('EC');
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
