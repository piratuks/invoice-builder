import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

vi.mock('../Dropdowns/ShippingFeesDropdown', () => ({
  ShippingFeesDropdown: ({ isOpen, onClick }: { isOpen: boolean; onClick: (value: never) => void }) =>
    isOpen ? <button onClick={() => onClick(12 as never)}>save-shipping</button> : null
}));
vi.mock('../Dropdowns/DiscountDropdown', () => ({
  DiscountDropdown: ({ isOpen, onClick }: { isOpen: boolean; onClick: (value: never) => void }) =>
    isOpen ? (
      <button onClick={() => onClick({ discountAmount: 3, discountRate: 5 } as never)}>save-discount</button>
    ) : null
}));
vi.mock('../Dropdowns/TaxDropdown', () => ({
  TaxDropdown: ({ isOpen, onClick }: { isOpen: boolean; onClick: (value: never) => void }) =>
    isOpen ? <button onClick={() => onClick({ taxRate: 20, invoiceItems: [] } as never)}>save-tax</button> : null
}));
vi.mock('../Dropdowns/SurchargeDropdown', () => ({
  SurchargeDropdown: ({ isOpen, onClick }: { isOpen: boolean; onClick: (value: never) => void }) =>
    isOpen ? (
      <button onClick={() => onClick({ surchargeAmount: 4, surchargeRate: 6 } as never)}>save-surcharge</button>
    ) : null
}));
vi.mock('../Dropdowns/AddPaymentDropdown', () => ({
  AddPaymentDropdown: ({ isOpen, onClick }: { isOpen: boolean; onClick: (value: never) => void }) =>
    isOpen ? (
      <button onClick={() => onClick({ paidAmount: 10, paidAt: '2024-01-01', paymentMethod: 'cash' } as never)}>
        save-payment
      </button>
    ) : null
}));
vi.mock('../Dropdowns/PaymentListDropdown', () => ({
  PaymentListDropdown: ({
    isOpen,
    onAdd,
    onClick,
    onRemove
  }: {
    isOpen: boolean;
    onAdd: () => void;
    onClick: (value: never) => void;
    onRemove: (value: never) => void;
  }) =>
    isOpen ? (
      <div>
        <button type="button" onClick={onAdd}>
          add-payment-row
        </button>
        <button type="button" onClick={() => onClick({ id: 2, amountCents: '10' } as never)}>
          edit-payment-row
        </button>
        <button type="button" onClick={() => onRemove({ id: 2 } as never)}>
          remove-payment-row
        </button>
      </div>
    ) : null
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const invoice = {
  invoiceType: InvoiceType.invoice,
  invoiceItems: [],
  invoicePayments: [],
  discountAmountCents: '0',
  shippingFeeCents: '0',
  surchargeAmountCents: '0',
  taxRate: 0
} as unknown as InvoiceFromData;

describe('FinancialInfo callback branches', () => {
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

  it('opens and forwards all financial adjustments', async () => {
    const user = userEvent.setup();
    const callbacks = {
      shipping: vi.fn(),
      discount: vi.fn(),
      tax: vi.fn(),
      surcharge: vi.fn(),
      add: vi.fn(),
      remove: vi.fn()
    };
    render(
      <FinancialInfo
        invoiceForm={invoice}
        onShippingFeesClick={callbacks.shipping}
        onDiscountClick={callbacks.discount}
        onTaxesClick={callbacks.tax}
        onSurchargeClick={callbacks.surcharge}
        onAddPaymentClicked={callbacks.add}
        onRemovePaymentClicked={callbacks.remove}
      />,
      { wrapper }
    );

    const values = screen.getAllByText(/^0\.00$/);
    await user.click(values[1]);
    await user.click(screen.getByRole('button', { name: /save-discount/i }));
    await user.click(values[2]);
    await user.click(screen.getByRole('button', { name: /save-tax/i }));
    await user.click(values[3]);
    await user.click(screen.getByRole('button', { name: /save-shipping/i }));
    await user.click(values[4]);
    await user.click(screen.getByRole('button', { name: /save-surcharge/i }));

    expect(callbacks.discount).toHaveBeenCalled();
    expect(callbacks.tax).toHaveBeenCalled();
    expect(callbacks.shipping).toHaveBeenCalledWith(12);
    expect(callbacks.surcharge).toHaveBeenCalled();
  });

  it('covers payment list add, edit, and remove actions', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    render(
      <FinancialInfo
        invoiceForm={{ ...invoice, invoicePayments: [{ id: 2, amountCents: '10' }] } as InvoiceFromData}
        onShippingFeesClick={vi.fn()}
        onDiscountClick={vi.fn()}
        onTaxesClick={vi.fn()}
        onSurchargeClick={vi.fn()}
        onAddPaymentClicked={onAdd}
        onRemovePaymentClicked={onRemove}
      />,
      { wrapper }
    );

    const values = screen.getAllByText(/^(0\.00|10\.00)$/);
    await user.click(values[6]);
    await user.click(screen.getByRole('button', { name: /add-payment-row/i }));
    await user.click(screen.getByRole('button', { name: /save-payment/i }));
    await user.click(screen.getByRole('button', { name: /remove-payment-row/i }));

    expect(onAdd).toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalledWith({ id: 2 });
  });
});
