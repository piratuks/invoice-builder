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
import { InvoiceItemTaxType, InvoiceTaxType } from '../../../../../shared/enums/taxType';
import { store } from '../../../../../state/configureStore';
import { setSettings } from '../../../../../state/pageSlice';
import { AddPaymentDropdown } from '../AddPaymentDropdown';
import { DiscountDropdown } from '../DiscountDropdown';
import { PaymentListDropdown } from '../PaymentListDropdown';
import { ShippingFeesDropdown } from '../ShippingFeesDropdown';
import { SurchargeDropdown } from '../SurchargeDropdown';
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

  it('edits and saves a percentage discount', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <DiscountDropdown
        isOpen={true}
        data={{ discountType: DiscountType.percentage, discountAmount: 0, discountRate: 5, discountName: 'Promo' }}
        onClick={onClick}
      />,
      { wrapper }
    );

    const rateInput = screen.getByRole('textbox', { name: i18n.t('invoices.percentage') });
    await user.clear(rateInput);
    await user.type(rateInput, '12');
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() =>
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({ discountType: DiscountType.percentage, discountRate: 12 })
      )
    );
  });

  it('edits and saves a percentage surcharge', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <SurchargeDropdown
        isOpen={true}
        data={{ surchargeType: DiscountType.percentage, surchargeAmount: 0, surchargeRate: 4, surchargeName: 'Fuel' }}
        onClick={onClick}
      />,
      { wrapper }
    );

    const rateInput = screen.getByRole('textbox', { name: i18n.t('invoices.percentage') });
    await user.clear(rateInput);
    await user.type(rateInput, '7');
    await user.clear(screen.getByRole('textbox', { name: i18n.t('common.name') }));
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'Handling');
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() =>
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({ surchargeType: DiscountType.percentage, surchargeRate: 7, surchargeName: 'Handling' })
      )
    );
  });

  it('selects, edits, and saves a fixed surcharge', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<SurchargeDropdown isOpen={true} onClick={onClick} />, { wrapper });

    await user.click(screen.getByRole('combobox', { name: i18n.t('invoices.type') }));
    await user.click(await screen.findByRole('option', { name: i18n.t('invoices.fixed') }));
    const amountInput = screen.getByRole('textbox', { name: i18n.t('invoices.fixed') });
    await user.clear(amountInput);
    await user.type(amountInput, '18');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'Service');
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() =>
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({ surchargeType: DiscountType.fixed, surchargeAmount: 18, surchargeName: 'Service' })
      )
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

  it('toggles an on-total tax between exclusive and inclusive', async () => {
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

    await user.click(screen.getByRole('switch', { name: i18n.t('invoices.inclusive') }));
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() =>
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ taxType: InvoiceTaxType.inclusive }))
    );
  });

  it('updates per-item rates and inclusive tax mode', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const invoiceItem = {
      itemId: 1,
      quantity: 1,
      taxRate: 5,
      taxType: InvoiceItemTaxType.exclusive,
      invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Consulting', unitPriceCents: '10000' }
    };

    render(
      <TaxDropdown
        isOpen={true}
        data={{ taxType: undefined, taxRate: 0, taxName: '', invoiceItems: [invoiceItem] } as never}
        onClick={onClick}
      />,
      { wrapper }
    );

    const itemRate = screen.getByRole('textbox', { name: '%' });
    await user.clear(itemRate);
    await user.type(itemRate, '8');
    await user.click(screen.getByRole('switch', { name: i18n.t('invoices.inclusive') }));
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() =>
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceItems: [expect.objectContaining({ taxRate: 8, taxType: InvoiceItemTaxType.inclusive })]
        })
      )
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
