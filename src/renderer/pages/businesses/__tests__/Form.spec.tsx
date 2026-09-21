import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import type { Business } from '../../../shared/types/business';
import { store } from '../../../state/configureStore';
import { Form } from '../Form';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('businesses Form', () => {
  it('reports an invalid form when required name/shortName fields are empty', async () => {
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('becomes valid once name and shortName are entered', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'Acme Corp');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.shortName') }), 'AC');

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isFormValid: true,
          business: expect.objectContaining({ name: 'Acme Corp', shortName: 'AC' })
        })
      )
    );
  });

  it('shows a validation error for an invalid email and marks the form invalid', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'Acme Corp');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.shortName') }), 'AC');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.email') }), 'not-an-email');

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('pre-fills the form fields from an existing business', () => {
    const business: Business = {
      id: 1,
      name: 'Existing Business',
      shortName: 'EB',
      email: '',
      phone: '',
      role: '',
      address: '',
      website: '',
      additional: '',
      vatCode: '',
      paymentInformation: '',
      description: '',
      peppolEndpointSchemeId: '',
      peppolEndpointId: '',
      countryCode: '',
      code: '',
      isArchived: false,
      invoiceCount: 0,
      quotesCount: 0
    } as Business;

    render(<Form business={business} />, { wrapper });

    expect(screen.getByRole('textbox', { name: i18n.t('common.name') })).toHaveValue('Existing Business');
    expect(screen.getByRole('textbox', { name: i18n.t('common.shortName') })).toHaveValue('EB');
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
