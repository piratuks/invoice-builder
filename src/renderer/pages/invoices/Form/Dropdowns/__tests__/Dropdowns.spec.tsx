import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../../i18n';
import { AmountFormat } from '../../../../../shared/enums/amountFormat';
import { DateFormat } from '../../../../../shared/enums/dateFormat';
import { DiscountType } from '../../../../../shared/enums/discountType';
import { InvoiceType } from '../../../../../shared/enums/invoiceType';
import { Language } from '../../../../../shared/enums/language';
import { PaymentType } from '../../../../../shared/enums/paymentType';
import { InvoiceTaxType } from '../../../../../shared/enums/taxType';
import { store } from '../../../../../state/configureStore';
import { setSettings } from '../../../../../state/pageSlice';
import { AddPaymentDropdown } from '../AddPaymentDropdown';
import { DiscountDropdown } from '../DiscountDropdown';
import { PaymentListDropdown } from '../PaymentListDropdown';
import { ShippingFeesDropdown } from '../ShippingFeesDropdown';
import { TaxDropdown } from '../TaxDropdown';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('invoice form dropdowns', () => {
  beforeEach(() => {
    store.dispatch(
      setSettings({
        id: 1,
        language: Language.en,
        amountFormat: AmountFormat.enUS,
        dateFormat: DateFormat.MMddyyyy,
        isDarkMode: false,
        shouldIncludeYear: false,
        shouldIncludeMonth: false,
        shouldIncludeBusinessName: false,
        quotesON: true,
        styleProfilesON: false,
        ublON: false,
        xrechnungON: false,
        receiptPrintingOn: false,
        presetsON: false,
        reportsON: false,
        createdAt: '',
        updatedAt: ''
      })
    );
  });

  it('saves a shipping fee from the shipping fee drawer', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ShippingFeesDropdown isOpen={true} currShippingFee={10} onClick={onClick} />, { wrapper });

    const feeInput = await screen.findByRole('textbox', { name: i18n.t('invoices.fixedFee') });
    await user.clear(feeInput);
    await user.type(feeInput, '15');
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => expect(onClick).toHaveBeenCalledWith(15));
  });

  it('saves a fixed discount from the discount drawer', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <DiscountDropdown
        isOpen={true}
        data={{ discountType: DiscountType.fixed, discountAmount: 5, discountRate: 0, discountName: 'Promo' }}
        onClick={onClick}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    await waitFor(() =>
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ discountType: DiscountType.fixed }))
    );
  });

  it('saves a tax configuration from the tax drawer', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <TaxDropdown
        isOpen={true}
        data={{ taxType: InvoiceTaxType.exclusive, taxRate: 20, taxName: 'VAT', invoiceItems: [] }}
        onClick={onClick}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    await waitFor(() =>
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ taxType: InvoiceTaxType.exclusive }))
    );
  });

  it('saves a payment from the add-payment drawer', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <AddPaymentDropdown
        isOpen={true}
        data={{ paymentMethod: PaymentType.cash, paidAmount: 25, paidAt: '2024-01-01', notes: 'cash', id: 1 }}
        onClick={onClick}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    await waitFor(() =>
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: PaymentType.cash }))
    );
  });

  it('opens the payment list and lets the user select a payment row', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onAdd = vi.fn();

    render(
      <PaymentListDropdown
        isOpen={true}
        data={[
          {
            id: 1,
            paidAt: '2024-01-01',
            paymentMethod: PaymentType.cash,
            notes: 'cash',
            amountCents: '2500'
          }
        ]}
        invoiceForm={{
          invoiceCurrencySnapshot: { currencyCode: 'USD', currencySymbol: '$', currencySubunit: 100 },
          invoiceType: InvoiceType.invoice,
          currencyFormat: AmountFormat.enUS
        }}
        onClick={onClick}
        onAdd={onAdd}
      />,
      { wrapper }
    );

    await user.click(screen.getByText(PaymentType.cash));
    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.add') }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
