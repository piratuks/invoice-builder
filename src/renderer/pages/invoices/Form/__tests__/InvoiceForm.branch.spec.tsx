import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../../i18n';
import { AmountFormat } from '../../../../shared/enums/amountFormat';
import { DateFormat } from '../../../../shared/enums/dateFormat';
import { InvoiceType } from '../../../../shared/enums/invoiceType';
import { Language } from '../../../../shared/enums/language';
import { PaymentType } from '../../../../shared/enums/paymentType';
import type { InvoiceFromData, InvoiceItem } from '../../../../shared/types/invoice';
import { store } from '../../../../state/configureStore';
import { setSettings } from '../../../../state/pageSlice';
import { InvoiceForm } from '../index';

const mockApi = {
  getAllBanks: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getAllBusinesses: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getAllStyleProfiles: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getAllCurrencies: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getAllClients: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getAllItems: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getCustomHeaders: vi.fn().mockResolvedValue({ success: true, data: [] })
};

vi.mock('../../../../shared/api/restApi', () => ({
  getApi: vi.fn(() => mockApi),
  isWebMode: () => true
}));

vi.mock('react-signature-canvas', () => ({ default: () => <div data-testid="signature-canvas-stub" /> }));

type MockItemRowProps = {
  invoiceForm?: InvoiceFromData;
  onDelete: (item: InvoiceItem) => void;
  onEdit: (item: InvoiceItem) => void;
};

type MockItemMetadataSetterProps = {
  isOpen?: boolean;
  onSave: (value: Record<string, unknown>) => void;
};

type MockFinancialInfoProps = {
  onAddPaymentClicked: (data: Record<string, unknown>) => void;
  onShippingFeesClick: (value: number) => void;
  onDiscountClick: (value: Record<string, unknown>) => void;
  onSurchargeClick: (value: Record<string, unknown>) => void;
  onTaxesClick: (value: Record<string, unknown>) => void;
};

type MockTopRowProps = {
  onEditBank: () => void;
  onEditCurrency: () => void;
  onEditLanguage: () => void;
  onEditStyleProfile: () => void;
  onClearBank: () => void;
};

type MockClientInvoiceRowProps = {
  onEditClients: () => void;
  onEditInvoiceInfo: () => void;
};

type MockStatusSelectorProps = {
  onArchivedChanged: (value: boolean) => void;
  onStatusChanged: (value: string) => void;
};

type MockNotesSelectorProps = {
  onCustomerNotesChanged: (value: string) => void;
  onThanksNotesChanged: (value: string) => void;
  onTermsConditionsNotesChanged: (value: string) => void;
};

type MockSignatureSelectorProps = {
  onEdit: (value: Record<string, unknown>) => void;
};

type MockAttachmentsListProps = {
  onAttach: (value: Record<string, unknown>) => void;
  onClear: (value: number) => void;
};

type MockDropdownProps = {
  onClick: (value: Record<string, unknown>) => void;
};

type MockLanguageDropdownProps = {
  onClick: (value: Language) => void;
};

vi.mock('../ItemsList', () => ({
  ItemsList: ({ invoiceForm, onDelete, onEdit }: MockItemRowProps) => (
    <div>
      {(invoiceForm?.invoiceItems ?? []).map((item: InvoiceItem) => (
        <div key={item.id}>
          <button type="button" onClick={() => onDelete(item)}>
            delete-item-{item.id}
          </button>
          <button type="button" onClick={() => onEdit(item)}>
            edit-item-{item.id}
          </button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../Modals/ItemMetadataSetter', () => ({
  ItemMetadataSetter: ({ isOpen, onSave }: MockItemMetadataSetterProps) =>
    isOpen ? (
      <button
        type="button"
        onClick={() =>
          onSave({
            quantity: 2,
            unitPrice: 150,
            header: 'Custom',
            value: 'Value',
            alignment: 'left',
            sortOrder: 1
          })
        }
      >
        save-item-metadata
      </button>
    ) : null
}));

vi.mock('../FinancialInfo', () => ({
  FinancialInfo: ({
    onAddPaymentClicked,
    onShippingFeesClick,
    onDiscountClick,
    onSurchargeClick,
    onTaxesClick
  }: MockFinancialInfoProps) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onAddPaymentClicked({
            id: undefined,
            paidAmount: 150,
            paidAt: '2024-01-10',
            paymentMethod: PaymentType.cash,
            notes: 'paid'
          })
        }
      >
        add-payment
      </button>
      <button type="button" onClick={() => onShippingFeesClick(12)}>
        set-shipping
      </button>
      <button
        type="button"
        onClick={() => onDiscountClick({ discountName: 'Discount', discountAmount: 3, discountRate: 5 })}
      >
        set-discount
      </button>
      <button
        type="button"
        onClick={() => onSurchargeClick({ surchargeName: 'Surcharge', surchargeAmount: 4, surchargeRate: 6 })}
      >
        set-surcharge
      </button>
      <button type="button" onClick={() => onTaxesClick({ taxName: 'VAT', taxRate: 20, invoiceItems: [] })}>
        set-tax
      </button>
    </div>
  )
}));

vi.mock('../TopRow', () => ({
  TopRow: ({ onEditBank, onEditCurrency, onEditLanguage, onEditStyleProfile, onClearBank }: MockTopRowProps) => (
    <div>
      <button type="button" onClick={onEditBank}>
        open-bank
      </button>
      <button type="button" onClick={onEditCurrency}>
        open-currency
      </button>
      <button type="button" onClick={onEditLanguage}>
        open-language
      </button>
      <button type="button" onClick={onEditStyleProfile}>
        open-style
      </button>
      <button type="button" onClick={onClearBank}>
        clear-bank
      </button>
    </div>
  )
}));

vi.mock('../ClientInvoiceRow', () => ({
  ClientInvoiceRow: ({ onEditClients, onEditInvoiceInfo }: MockClientInvoiceRowProps) => (
    <div>
      <button type="button" onClick={onEditClients}>
        open-client
      </button>
      <button type="button" onClick={onEditInvoiceInfo}>
        open-invoice-info
      </button>
    </div>
  )
}));

vi.mock('../StatusSelector', () => ({
  StatusSelector: ({ onArchivedChanged, onStatusChanged }: MockStatusSelectorProps) => (
    <div>
      <button type="button" onClick={() => onArchivedChanged(true)}>
        archive
      </button>
      <button type="button" onClick={() => onStatusChanged('paid')}>
        set-status
      </button>
    </div>
  )
}));

vi.mock('../NotesSelector', () => ({
  NotesSelector: ({
    onCustomerNotesChanged,
    onThanksNotesChanged,
    onTermsConditionsNotesChanged
  }: MockNotesSelectorProps) => (
    <div>
      <button type="button" onClick={() => onCustomerNotesChanged('Customer')}>
        customer-note
      </button>
      <button type="button" onClick={() => onThanksNotesChanged('Thanks')}>
        thanks-note
      </button>
      <button type="button" onClick={() => onTermsConditionsNotesChanged('Terms')}>
        terms-note
      </button>
    </div>
  )
}));

vi.mock('../SignatureSelector', () => ({
  SignatureSelector: ({ onEdit }: MockSignatureSelectorProps) => (
    <button type="button" onClick={() => onEdit({ data: 'signature', name: 'Signer', type: 'png', size: 'small' })}>
      set-signature
    </button>
  )
}));

vi.mock('../AttachmentsList', () => ({
  AttachmentsList: ({ onAttach, onClear }: MockAttachmentsListProps) => (
    <div>
      <button
        type="button"
        onClick={() => onAttach({ fileName: 'file.txt', fileType: 'text/plain', fileSize: 10, data: 'data' })}
      >
        attach-file
      </button>
      <button type="button" onClick={() => onClear(1)}>
        clear-file
      </button>
    </div>
  )
}));

vi.mock('../Dropdowns/BusinessesDropdown', () => ({
  BusinessesDropdown: ({ onClick }: MockDropdownProps) => (
    <button
      type="button"
      onClick={() =>
        onClick({
          id: 2,
          name: 'Acme Corp',
          shortName: 'AC',
          address: '1 Main St',
          role: 'Seller',
          email: 'hello@acme.com',
          phone: '123',
          additional: 'Add',
          paymentInformation: 'Info',
          vatCode: 'VAT',
          countryCode: 'US',
          code: 'AC',
          peppolEndpointId: 'ep',
          peppolEndpointSchemeId: 'scheme',
          invoiceCount: 0,
          quotesCount: 0,
          isArchived: false
        })
      }
    >
      select-business
    </button>
  )
}));

vi.mock('../Dropdowns/CurrenciesDropdown', () => ({
  CurrenciesDropdown: ({ onClick }: MockDropdownProps) => (
    <button type="button" onClick={() => onClick({ id: 2, code: 'EUR', symbol: '€', subunit: 100, format: 'EUR' })}>
      select-currency
    </button>
  )
}));

vi.mock('../Dropdowns/InvoiceInformationDropdown', () => ({
  InvoiceInformationDropdown: ({ onClick }: MockDropdownProps) => (
    <button
      type="button"
      onClick={() =>
        onClick({
          issuedAt: '2024-05-10',
          invoiceNumber: 'INV-42',
          dueDate: '2024-05-20',
          invoicePrefix: 'PRE',
          invoiceSuffix: 'SUF'
        })
      }
    >
      select-invoice-info
    </button>
  )
}));

vi.mock('../Dropdowns/BanksDropdown', () => ({
  BanksDropdown: ({ onClick }: MockDropdownProps) => (
    <button type="button" onClick={() => onClick({ id: 3, name: 'Main', bankName: 'Bank', accountNumber: '123' })}>
      select-bank
    </button>
  )
}));

vi.mock('../Dropdowns/StyleProfilesDropdown', () => ({
  StyleProfilesDropdown: ({ onClick }: MockDropdownProps) => (
    <button type="button" onClick={() => onClick({ id: 4, layoutId: 5, name: 'Brand', color: '#123456' })}>
      select-style
    </button>
  )
}));

vi.mock('../Dropdowns/LanguageDropdown', () => ({
  LanguageDropdown: ({ onClick }: MockLanguageDropdownProps) => (
    <button type="button" onClick={() => onClick(Language.de)}>
      select-language
    </button>
  )
}));

vi.mock('../Dropdowns/ClientsDropdown', () => ({
  ClientsDropdown: ({ onClick }: MockDropdownProps) => (
    <button type="button" onClick={() => onClick({ id: 6, name: 'Client B' })}>
      select-client
    </button>
  )
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/invoices']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

const baseForm: InvoiceFromData = {
  id: 1,
  invoiceType: InvoiceType.invoice,
  businessId: 1,
  clientId: 1,
  currencyId: 1,
  layoutId: 1,
  issuedAt: '2024-01-01',
  invoiceNumber: 'INV-1',
  language: Language.en,
  invoiceItems: [
    {
      id: 1,
      itemId: 1,
      quantity: '1',
      taxRate: 0,
      invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Item A', unitPriceCents: '100' }
    }
  ],
  invoicePayments: [],
  discountAmountCents: '0',
  shippingFeeCents: '0',
  surchargeAmountCents: '0',
  invoiceCurrencySnapshot: { currencyCode: 'USD', currencySymbol: '$', currencySubunit: 100 },
  invoiceBusinessSnapshot: { businessName: 'Old Business', businessShortName: 'Old' },
  taxRate: 0,
  isArchived: false
};

function InvoiceFormHarness({ initial = baseForm }: { initial?: InvoiceFromData }) {
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFromData | undefined>(initial);

  return (
    <>
      <div data-testid="currency-id">{invoiceForm?.currencyId}</div>
      <div data-testid="business-name">{invoiceForm?.invoiceBusinessSnapshot?.businessName ?? 'none'}</div>
      <div data-testid="invoice-number">{invoiceForm?.invoiceNumber ?? 'none'}</div>
      <div data-testid="payment-method">{invoiceForm?.invoicePayments?.[0]?.paymentMethod ?? 'none'}</div>
      <div data-testid="item-quantity">{invoiceForm?.invoiceItems?.[0]?.quantity ?? 'none'}</div>
      <div data-testid="item-unit-price">
        {invoiceForm?.invoiceItems?.[0]?.invoiceItemSnapshot.unitPriceCents ?? 'none'}
      </div>
      <div data-testid="bank-id">{invoiceForm?.bankId ?? 'none'}</div>
      <div data-testid="style-id">{invoiceForm?.styleProfilesId ?? 'none'}</div>
      <div data-testid="language">{invoiceForm?.language}</div>
      <div data-testid="client-id">{invoiceForm?.clientId}</div>
      <div data-testid="shipping">{invoiceForm?.shippingFeeCents}</div>
      <div data-testid="discount">{invoiceForm?.discountAmountCents}</div>
      <div data-testid="surcharge">{invoiceForm?.surchargeAmountCents}</div>
      <div data-testid="tax-rate">{invoiceForm?.taxRate}</div>
      <div data-testid="archived">{String(invoiceForm?.isArchived)}</div>
      <div data-testid="status">{invoiceForm?.status ?? 'none'}</div>
      <div data-testid="customer-notes">{invoiceForm?.customerNotes ?? 'none'}</div>
      <div data-testid="attachment-count">{invoiceForm?.invoiceAttachments?.length ?? 0}</div>
      <div data-testid="signature">{invoiceForm?.signatureName ?? 'none'}</div>
      <InvoiceForm invoiceForm={invoiceForm} setInvoiceForm={setInvoiceForm} type={InvoiceType.invoice} />
    </>
  );
}

describe('InvoiceForm branching behaviors', () => {
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

  it('updates the selected business snapshot', async () => {
    const user = userEvent.setup();
    render(<InvoiceFormHarness />, { wrapper });

    await user.click(screen.getByRole('button', { name: /select-business/i }));

    expect(screen.getByTestId('business-name')).toHaveTextContent('Acme Corp');
  });

  it('updates currency metadata and item values when a currency is selected', async () => {
    const user = userEvent.setup();
    render(<InvoiceFormHarness />, { wrapper });

    await user.click(screen.getByRole('button', { name: /select-currency/i }));

    expect(screen.getByTestId('currency-id')).toHaveTextContent('2');
    expect(screen.getByTestId('item-unit-price')).toHaveTextContent('100');
  });

  it('updates invoice metadata from the invoice info dropdown', async () => {
    const user = userEvent.setup();
    render(<InvoiceFormHarness />, { wrapper });

    await user.click(screen.getByRole('button', { name: /open-invoice-info/i }));
    await user.click(screen.getByRole('button', { name: /select-invoice-info/i }));

    expect(screen.getByTestId('invoice-number')).toHaveTextContent('INV-42');
  });

  it('adds a payment when the payment action is triggered', async () => {
    const user = userEvent.setup();
    render(<InvoiceFormHarness />, { wrapper });

    await user.click(screen.getByRole('button', { name: /add-payment/i }));

    expect(screen.getByTestId('payment-method')).toHaveTextContent(/cash/i);
  });

  it('removes an item when the delete action is triggered', async () => {
    const user = userEvent.setup();
    render(<InvoiceFormHarness />, { wrapper });

    await user.click(screen.getByRole('button', { name: /delete-item-1/i }));

    expect(screen.getByTestId('item-quantity')).toHaveTextContent('none');
  });

  it('updates item metadata when the item metadata save action is triggered', async () => {
    const user = userEvent.setup();
    render(<InvoiceFormHarness />, { wrapper });

    await user.click(screen.getByRole('button', { name: /edit-item-1/i }));
    await user.click(screen.getByRole('button', { name: /save-item-metadata/i }));

    expect(screen.getByTestId('item-quantity')).toHaveTextContent('2');
    expect(screen.getByTestId('item-unit-price')).toHaveTextContent('150');
  });
});
