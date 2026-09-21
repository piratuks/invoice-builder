import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { AmountFormat } from '../../../../shared/enums/amountFormat';
import { DateFormat } from '../../../../shared/enums/dateFormat';
import { InvoiceType } from '../../../../shared/enums/invoiceType';
import { Language } from '../../../../shared/enums/language';
import type { InvoiceFromData } from '../../../../shared/types/invoice';
import { store } from '../../../../state/configureStore';
import { setSettings } from '../../../../state/pageSlice';
import { FinancialInfo } from '../FinancialInfo';

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    (() => ({
      matches: true,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }));
  vi.spyOn(window, 'matchMedia').mockImplementation(
    query =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      }) as unknown as MediaQueryList
  );
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

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

const baseInvoiceForm: Partial<InvoiceFromData> = {
  invoiceType: InvoiceType.invoice,
  invoiceItems: [],
  invoicePayments: [],
  discountAmountCents: '0',
  shippingFeeCents: '0',
  surchargeAmountCents: '0',
  taxRate: 0
};

const noop = () => {};

describe('FinancialInfo', () => {
  it('renders the financial summary labels', () => {
    render(
      <FinancialInfo
        invoiceForm={baseInvoiceForm as InvoiceFromData}
        onShippingFeesClick={noop}
        onDiscountClick={noop}
        onTaxesClick={noop}
        onSurchargeClick={noop}
        onAddPaymentClicked={noop}
        onRemovePaymentClicked={noop}
      />,
      { wrapper }
    );

    expect(screen.getByText(i18n.t('invoices.subTotal'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('common.total'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('invoices.paid'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('invoices.balanceDue'))).toBeInTheDocument();
  });

  it('opens the shipping fees drawer and saves a new fee', async () => {
    const user = userEvent.setup();
    const onShippingFeesClick = vi.fn();
    const { container } = render(
      <FinancialInfo
        invoiceForm={baseInvoiceForm as InvoiceFromData}
        onShippingFeesClick={onShippingFeesClick}
        onDiscountClick={noop}
        onTaxesClick={noop}
        onSurchargeClick={noop}
        onAddPaymentClicked={noop}
        onRemovePaymentClicked={noop}
      />,
      { wrapper }
    );

    const valuesColumn = container.firstElementChild!.children[1];
    await user.click(valuesColumn.children[3]);

    const feeInput = await screen.findByRole('textbox', { name: i18n.t('invoices.fixedFee') });
    await user.clear(feeInput);
    await user.type(feeInput, '15');

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => expect(onShippingFeesClick).toHaveBeenCalledWith(15));
  });

  it('opens the add-payment drawer directly when there are no existing payments', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FinancialInfo
        invoiceForm={baseInvoiceForm as InvoiceFromData}
        onShippingFeesClick={noop}
        onDiscountClick={noop}
        onTaxesClick={noop}
        onSurchargeClick={noop}
        onAddPaymentClicked={noop}
        onRemovePaymentClicked={noop}
      />,
      { wrapper }
    );

    const valuesColumn = container.firstElementChild!.children[1];
    await user.click(valuesColumn.children[6]);

    expect(await screen.findByText(i18n.t('invoices.addPayment'))).toBeInTheDocument();
  });

  it('does not render the paid/balance rows for quotes', () => {
    render(
      <FinancialInfo
        invoiceForm={{ ...baseInvoiceForm, invoiceType: InvoiceType.quotation } as InvoiceFromData}
        onShippingFeesClick={noop}
        onDiscountClick={noop}
        onTaxesClick={noop}
        onSurchargeClick={noop}
        onAddPaymentClicked={noop}
        onRemovePaymentClicked={noop}
      />,
      { wrapper }
    );

    expect(screen.queryByText(i18n.t('invoices.paid'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t('invoices.balanceDue'))).not.toBeInTheDocument();
  });
});
