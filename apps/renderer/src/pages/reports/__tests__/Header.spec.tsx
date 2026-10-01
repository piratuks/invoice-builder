import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import type { InvoicesByCurrency } from '../../../shared/types/invoice';
import { store } from '../../../state/configureStore';
import { Header } from '../Header';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('reports Header', () => {
  it('renders the reports title', () => {
    render(<Header currencies={{}} />, { wrapper });

    expect(screen.getByText(i18n.t('reports.title'))).toBeInTheDocument();
  });

  it('notifies date changes once mounted with the default 30-day range', async () => {
    const onDateChange = vi.fn();
    render(<Header currencies={{}} onDateChange={onDateChange} />, { wrapper });

    await waitFor(() => expect(onDateChange).toHaveBeenCalled());
    const [{ from, to }] = onDateChange.mock.calls[onDateChange.mock.calls.length - 1];
    expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime());
  });

  it('selects the first available currency automatically and reports it', async () => {
    const onCurrencyChange = vi.fn();
    const currencies: InvoicesByCurrency = {
      USD: {
        currencyCode: 'USD',
        currencySymbol: '$',
        totalAmount: 100,
        totalAmountPaid: 50,
        balanceDue: 50,
        invoiceCount: 2,
        overdueCount: 0,
        collectionRate: 0.5,
        avgPerInvoice: 50,
        issuedAt: new Date().toISOString(),
        currencyId: 1
      }
    };

    render(<Header currencies={currencies} onCurrencyChange={onCurrencyChange} />, { wrapper });

    await waitFor(() => expect(onCurrencyChange).toHaveBeenCalledWith('USD'));
  });

  it('changes the report date type when a different option is selected', async () => {
    const user = userEvent.setup();
    const onDateTypeChange = vi.fn();
    render(<Header currencies={{}} onDateTypeChange={onDateTypeChange} />, { wrapper });

    const dateTypeSelect = screen.getAllByRole('combobox')[0];
    await user.click(dateTypeSelect);
    await user.click(await screen.findByRole('option', { name: i18n.t('reports.dateTypePaidAt') }));

    await waitFor(() => expect(onDateTypeChange).toHaveBeenCalledWith(expect.stringContaining('paid')));
  });
});
