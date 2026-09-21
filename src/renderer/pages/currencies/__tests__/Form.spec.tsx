import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import type { Currency } from '../../../shared/types/currency';
import { store } from '../../../state/configureStore';
import { Form } from '../Form';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('currencies Form', () => {
  it('reports an invalid form when required fields are empty', async () => {
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('becomes valid once code, symbol, text, format and subunit are filled in', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('currencies.code') }), 'USD');
    await user.type(screen.getByRole('textbox', { name: i18n.t('currencies.symbol') }), '$');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.text') }), 'United States Dollar');

    const formatInput = screen.getByRole('combobox', { name: i18n.t('currencies.format') });
    await user.click(formatInput);
    await user.keyboard('{ArrowDown}{Enter}');

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isFormValid: true,
          currency: expect.objectContaining({ code: 'USD', symbol: '$', text: 'United States Dollar' })
        })
      )
    );
  });

  it('pre-fills the form fields from an existing currency', () => {
    const currency: Currency = {
      id: 1,
      code: 'EUR',
      symbol: '€',
      text: 'Euro',
      format: '{symbol}{amount}',
      subunit: 100,
      isArchived: false,
      invoiceCount: 0,
      quotesCount: 0
    } as Currency;

    render(<Form currency={currency} />, { wrapper });

    expect(screen.getByRole('textbox', { name: i18n.t('currencies.code') })).toHaveValue('EUR');
    expect(screen.getByRole('textbox', { name: i18n.t('common.text') })).toHaveValue('Euro');
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
