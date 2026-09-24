import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../../i18n';
import { AmountFormat } from '../../../../shared/enums/amountFormat';
import { DateFormat } from '../../../../shared/enums/dateFormat';
import { InvoiceStatus } from '../../../../shared/enums/invoiceStatus';
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

const actionMocks = vi.hoisted(() => ({
  exportPdf: vi.fn(),
  exportXML: vi.fn(),
  exportPdfWithXml: vi.fn(),
  printReceipt: vi.fn(),
  retrieveXML: vi.fn(),
  resolveXML: undefined as ((value: unknown) => void) | undefined,
  rejectXML: undefined as ((reason: unknown) => void) | undefined
}));

vi.mock('../../../../shared/api/restApi', () => ({
  getApi: vi.fn(() => mockApi),
  isWebMode: () => true
}));

vi.mock('../../../../shared/hooks/fileExport/useExportPdf', () => ({
  useExportPdf: () => ({ exportPdf: actionMocks.exportPdf })
}));
vi.mock('../../../../shared/hooks/fileExport/useExportXML', () => ({
  useExportXML: () => ({ exportXML: actionMocks.exportXML })
}));
vi.mock('../../../../shared/hooks/fileExport/useExportPdfWithXml', () => ({
  useExportPdfWithXml: () => ({ exportPdfWithXml: actionMocks.exportPdfWithXml })
}));
vi.mock('../../../../shared/hooks/print/usePrintReceipt', () => ({
  usePrintReceipt: () => ({ printReceipt: actionMocks.printReceipt })
}));
vi.mock('../../../../shared/api/invoicesApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../shared/api/invoicesApi')>();
  return {
    ...actual,
    useLazyGetEInvoiceXMLQuery: () => {
      actionMocks.retrieveXML.mockImplementation(() => ({
        unwrap: () =>
          new Promise((resolve, reject) => {
            actionMocks.resolveXML = resolve;
            actionMocks.rejectXML = reject;
          })
      }));
      return [actionMocks.retrieveXML, { isFetching: false }];
    }
  };
});

vi.mock('react-signature-canvas', () => ({ default: () => <div data-testid="signature-canvas-stub" /> }));

type MockItemRowProps = {
  invoiceForm?: InvoiceFromData;
  onDelete: (item: InvoiceItem) => void;
  onEdit: (item: InvoiceItem) => void;
};

type MockItemMetadataSetterProps = {
  isOpen?: boolean;
  onCancel: () => void;
  onSave: (value: Record<string, unknown>) => void;
};

type MockFinancialInfoProps = {
  onAddPaymentClicked: (data: Record<string, unknown>) => void;
  onRemovePaymentClicked: (data: Record<string, unknown>) => void;
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
  onClose?: () => void;
  onOpen?: () => void;
};

type MockLanguageDropdownProps = {
  onClick: (value: Language) => void;
  onClose: () => void;
  onOpen: () => void;
};

const DropdownControls = ({ name, onClose, onOpen }: { name: string; onClose?: () => void; onOpen?: () => void }) => (
  <>
    <button type="button" onClick={onOpen}>
      open-{name}-dropdown
    </button>
    <button type="button" onClick={onClose}>
      close-{name}-dropdown
    </button>
  </>
);

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
  ItemMetadataSetter: ({ isOpen, onCancel, onSave }: MockItemMetadataSetterProps) =>
    isOpen ? (
      <div>
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
        <button type="button" onClick={onCancel}>
          cancel-item-metadata
        </button>
      </div>
    ) : null
}));

vi.mock('../FinancialInfo', () => ({
  FinancialInfo: ({
    onAddPaymentClicked,
    onRemovePaymentClicked,
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
      <button
        type="button"
        onClick={() =>
          onAddPaymentClicked({
            id: 9,
            paidAmount: 0.25,
            paidAt: '2024-01-11',
            paymentMethod: PaymentType.bank,
            notes: 'updated'
          })
        }
      >
        update-payment
      </button>
      <button
        type="button"
        onClick={() =>
          onAddPaymentClicked({
            id: 404,
            paidAmount: 2,
            paidAt: '2024-01-12',
            paymentMethod: PaymentType.cash
          })
        }
      >
        append-missing-payment
      </button>
      <button type="button" onClick={() => onAddPaymentClicked({ paidAmount: 0 })}>
        invalid-payment
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
      <button type="button" onClick={() => onRemovePaymentClicked({ id: 9 })}>
        remove-payment
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

vi.mock('../BusinessSelector', () => ({
  BusinessSelector: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>edit-business</button>
}));

vi.mock('../ItemSelector', () => ({
  ItemSelector: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>edit-items</button>
}));

vi.mock('../Dropdowns/ItemsDropdown', () => ({
  ItemsDropdown: ({ onClick }: { onClick: (item: Record<string, unknown>, data: Record<string, unknown>) => void }) => (
    <div>
      <button
        onClick={() =>
          onClick(
            { id: 8, name: 'Added item', unitName: 'hour' },
            { quantity: 3, unitPrice: 2, header: 'Code', value: 'A', alignment: 'right', sortOrder: 2 }
          )
        }
      >
        select-item
      </button>
      <button onClick={() => onClick({ id: 9, name: 'Plain item' }, { unitPrice: 4 })}>select-plain-item</button>
    </div>
  )
}));

vi.mock('../Dropdowns/BusinessesDropdown', () => ({
  BusinessesDropdown: ({ onClick, onClose, onOpen }: MockDropdownProps) => (
    <div>
      <DropdownControls name="business" onClose={onClose} onOpen={onOpen} />
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
    </div>
  )
}));

vi.mock('../Dropdowns/CurrenciesDropdown', () => ({
  CurrenciesDropdown: ({ onClick }: MockDropdownProps) => (
    <div>
      <button type="button" onClick={() => onClick({ id: 2, code: 'EUR', symbol: '€', subunit: 100, format: 'EUR' })}>
        select-currency
      </button>
      <button type="button" onClick={() => onClick({ id: 3, code: 'JPY', symbol: '¥', format: 'JPY' })}>
        select-unitless-currency
      </button>
    </div>
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

vi.mock('../Dropdowns/MoreActionDropdown', () => ({
  MoreActionDropdown: ({
    onPrintReceipt,
    onDelete,
    onDuplicate,
    onMakeInvoice,
    onExportPDF,
    onExportPDFUBL,
    onExportUBLXML,
    onExportXRechnungXML
  }: {
    onPrintReceipt: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMakeInvoice: () => void;
    onExportPDF: () => void;
    onExportPDFUBL: () => void;
    onExportUBLXML: () => void;
    onExportXRechnungXML: () => void;
  }) => (
    <div>
      <button type="button" onClick={onPrintReceipt}>
        action-print
      </button>
      <button type="button" onClick={onDelete}>
        action-delete
      </button>
      <button type="button" onClick={onDuplicate}>
        action-duplicate
      </button>
      <button type="button" onClick={onMakeInvoice}>
        action-make-invoice
      </button>
      <button type="button" onClick={onExportPDF}>
        action-pdf
      </button>
      <button type="button" onClick={onExportPDFUBL}>
        action-pdf-ubl
      </button>
      <button type="button" onClick={onExportUBLXML}>
        action-ubl
      </button>
      <button type="button" onClick={onExportXRechnungXML}>
        action-xrechnung
      </button>
    </div>
  )
}));

vi.mock('../Dropdowns/BanksDropdown', () => ({
  BanksDropdown: ({ onClick, onClose, onOpen }: MockDropdownProps) => (
    <div>
      <DropdownControls name="bank" onClose={onClose} onOpen={onOpen} />
      <button type="button" onClick={() => onClick({ id: 3, name: 'Main', bankName: 'Bank', accountNumber: '123' })}>
        select-bank
      </button>
    </div>
  )
}));

vi.mock('../Dropdowns/StyleProfilesDropdown', () => ({
  StyleProfilesDropdown: ({ onClick, onClose, onOpen }: MockDropdownProps) => (
    <div>
      <DropdownControls name="style" onClose={onClose} onOpen={onOpen} />
      <button type="button" onClick={() => onClick({ id: 4, layoutId: 5, name: 'Brand', color: '#123456' })}>
        select-style
      </button>
    </div>
  )
}));

vi.mock('../Dropdowns/LanguageDropdown', () => ({
  LanguageDropdown: ({ onClick, onClose, onOpen }: MockLanguageDropdownProps) => (
    <div>
      <DropdownControls name="language" onClose={onClose} onOpen={onOpen} />
      <button type="button" onClick={() => onClick(Language.de)}>
        select-language
      </button>
    </div>
  )
}));

vi.mock('../Dropdowns/ClientsDropdown', () => ({
  ClientsDropdown: ({ onClick, onClose, onOpen }: MockDropdownProps) => (
    <div>
      <DropdownControls name="client" onClose={onClose} onOpen={onOpen} />
      <button type="button" onClick={() => onClick({ id: 6, name: 'Client B' })}>
        select-client
      </button>
    </div>
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
      <div data-testid="payment-amount">{invoiceForm?.invoicePayments?.[0]?.amountCents ?? 'none'}</div>
      <div data-testid="payment-count">{invoiceForm?.invoicePayments?.length ?? 0}</div>
      <div data-testid="item-count">{invoiceForm?.invoiceItems?.length ?? 0}</div>
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
      <div data-testid="thanks-notes">{invoiceForm?.thanksNotes ?? 'none'}</div>
      <div data-testid="terms-notes">{invoiceForm?.termsConditionNotes ?? 'none'}</div>
      <div data-testid="second-item-alignment">{invoiceForm?.invoiceItems?.[1]?.customField?.alignment ?? 'none'}</div>
      <div data-testid="third-item-alignment">{invoiceForm?.invoiceItems?.[2]?.customField?.alignment ?? 'none'}</div>
      <InvoiceForm invoiceForm={invoiceForm} setInvoiceForm={setInvoiceForm} type={InvoiceType.invoice} />
    </>
  );
}

describe('InvoiceForm branching behaviors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.resolveXML = undefined;
    actionMocks.rejectXML = undefined;
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
    const initial = {
      ...baseForm,
      invoiceItems: [
        {
          ...baseForm.invoiceItems![0],
          customField: { header: 'Custom', value: 'old', alignment: 'right', sortOrder: 1 }
        },
        {
          ...baseForm.invoiceItems![0],
          id: 2,
          customField: { header: 'Custom', value: 'shared', alignment: 'right', sortOrder: 1 }
        },
        {
          ...baseForm.invoiceItems![0],
          id: 3,
          customField: { header: 'Other', value: 'untouched', alignment: 'right', sortOrder: 2 }
        }
      ]
    } as InvoiceFromData;
    render(<InvoiceFormHarness initial={initial} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /edit-item-1/i }));
    await user.click(screen.getByRole('button', { name: /save-item-metadata/i }));

    expect(screen.getByTestId('item-quantity')).toHaveTextContent('2');
    expect(screen.getByTestId('item-unit-price')).toHaveTextContent('150');
    expect(screen.getByTestId('second-item-alignment')).toHaveTextContent('left');
    expect(screen.getByTestId('third-item-alignment')).toHaveTextContent('right');
  });

  it('routes More Actions callbacks for an existing invoice', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onDuplicate = vi.fn();
    const invoiceForm = { ...baseForm, invoiceType: InvoiceType.quotation } as InvoiceFromData;

    render(
      <InvoiceForm
        invoiceForm={invoiceForm}
        setInvoiceForm={vi.fn()}
        handleDelete={onDelete}
        handleDuplicate={onDuplicate}
        type={InvoiceType.quotation}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: /action-print/i }));
    await user.click(screen.getByRole('button', { name: /action-delete/i }));
    await user.click(screen.getByRole('button', { name: /action-duplicate/i }));
    await user.click(screen.getByRole('button', { name: /action-make-invoice/i }));
    await user.click(screen.getByRole('button', { name: 'action-pdf' }));
    await user.click(screen.getByRole('button', { name: 'action-pdf-ubl' }));
    await waitFor(() => expect(actionMocks.retrieveXML).toHaveBeenCalledTimes(1));
    actionMocks.resolveXML?.(new Uint8Array([1]));
    await waitFor(() => expect(actionMocks.exportPdfWithXml).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'action-ubl' }));
    await waitFor(() => expect(actionMocks.retrieveXML).toHaveBeenCalledTimes(2));
    actionMocks.resolveXML?.(new Uint8Array([2]));
    await waitFor(() => expect(actionMocks.exportXML).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'action-xrechnung' }));
    await waitFor(() => expect(actionMocks.retrieveXML).toHaveBeenCalledTimes(3));
    actionMocks.rejectXML?.({ message: 'XML failed' });

    expect(onDelete).toHaveBeenCalledWith(1);
    expect(onDuplicate).toHaveBeenCalledWith(1, InvoiceType.quotation);
    expect(onDuplicate).toHaveBeenCalledWith(1, InvoiceType.invoice);
    expect(actionMocks.printReceipt).toHaveBeenCalledTimes(1);
    expect(actionMocks.exportPdf).toHaveBeenCalledTimes(1);
  });

  it('keeps persisted-only actions inert while creating an invoice', async () => {
    const user = userEvent.setup();
    const invoiceForm = { ...baseForm, id: undefined } as InvoiceFromData;

    render(<InvoiceForm invoiceForm={invoiceForm} setInvoiceForm={vi.fn()} type={InvoiceType.invoice} />, {
      wrapper
    });

    for (const name of [
      'action-print',
      'action-delete',
      'action-duplicate',
      'action-make-invoice',
      'action-pdf-ubl',
      'action-ubl',
      'action-xrechnung'
    ]) {
      await user.click(screen.getByRole('button', { name }));
    }
    await user.click(screen.getByRole('button', { name: 'action-pdf' }));

    expect(actionMocks.printReceipt).not.toHaveBeenCalled();
    expect(actionMocks.retrieveXML).not.toHaveBeenCalled();
    expect(actionMocks.exportPdf).toHaveBeenCalledTimes(1);
  });

  it('updates all ancillary invoice details', async () => {
    const user = userEvent.setup();
    const initial = {
      ...baseForm,
      invoicePayments: [{ id: 9, paidAt: '2024-01-01', paymentMethod: PaymentType.cash, amountCents: '50' }],
      invoiceAttachments: [
        { id: 1, fileName: 'old.txt', fileType: 'text/plain', fileSize: 1, data: new Uint8Array([111, 108, 100]) }
      ],
      invoiceCustomization: { color: '#000000' }
    } as InvoiceFromData;
    render(<InvoiceFormHarness initial={initial} />, { wrapper });

    for (const name of [
      'set-shipping',
      'set-discount',
      'set-surcharge',
      'archive',
      'set-status',
      'customer-note',
      'thanks-note',
      'terms-note',
      'set-signature',
      'attach-file',
      'clear-file',
      'clear-bank',
      'select-bank',
      'select-style',
      'select-language',
      'select-client',
      'set-tax'
    ]) {
      await user.click(screen.getByRole('button', { name }));
    }

    expect(screen.getByTestId('shipping')).toHaveTextContent('1200');
    expect(screen.getByTestId('discount')).toHaveTextContent('300');
    expect(screen.getByTestId('surcharge')).toHaveTextContent('400');
    expect(screen.getByTestId('tax-rate')).toHaveTextContent('20');
    expect(screen.getByTestId('archived')).toHaveTextContent('true');
    expect(screen.getByTestId('status')).toHaveTextContent('paid');
    expect(screen.getByTestId('customer-notes')).toHaveTextContent('Customer');
    expect(screen.getByTestId('thanks-notes')).toHaveTextContent('Thanks');
    expect(screen.getByTestId('terms-notes')).toHaveTextContent('Terms');
    expect(screen.getByTestId('signature')).toHaveTextContent('Signer');
    expect(screen.getByTestId('attachment-count')).toHaveTextContent('1');
    expect(screen.getByTestId('bank-id')).toHaveTextContent('3');
    expect(screen.getByTestId('style-id')).toHaveTextContent('4');
    expect(screen.getByTestId('language')).toHaveTextContent(Language.de);
    expect(screen.getByTestId('client-id')).toHaveTextContent('6');
  });

  it('adds a selected item with custom metadata and removes a payment', async () => {
    const user = userEvent.setup();
    const initial = {
      ...baseForm,
      invoicePayments: [{ id: 9, paidAt: '2024-01-01', paymentMethod: PaymentType.cash, amountCents: '100' }]
    } as InvoiceFromData;
    render(<InvoiceFormHarness initial={initial} />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'edit-items' }));
    await user.click(screen.getByRole('button', { name: 'select-item' }));
    expect(screen.getByTestId('item-count')).toHaveTextContent('2');
    await user.click(screen.getByRole('button', { name: 'remove-payment' }));
    expect(screen.getByTestId('payment-count')).toHaveTextContent('0');
  });

  it('converts values between currencies with and without subunits', async () => {
    const user = userEvent.setup();
    const initial = {
      ...baseForm,
      invoiceItems: [
        {
          ...baseForm.invoiceItems![0],
          invoiceItemSnapshot: { ...baseForm.invoiceItems![0].invoiceItemSnapshot, unitPriceCents: '100' }
        }
      ]
    } as InvoiceFromData;
    const { unmount } = render(<InvoiceFormHarness initial={initial} />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'select-unitless-currency' }));
    expect(screen.getByTestId('item-unit-price')).toHaveTextContent('1');
    unmount();

    render(
      <InvoiceFormHarness
        initial={
          {
            ...initial,
            invoiceCurrencySnapshot: { currencyCode: 'JPY', currencySymbol: '¥' },
            invoiceItems: [
              {
                ...initial.invoiceItems![0],
                invoiceItemSnapshot: { ...initial.invoiceItems![0].invoiceItemSnapshot, unitPriceCents: '2' }
              }
            ]
          } as InvoiceFromData
        }
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: 'select-currency' }));
    expect(screen.getByTestId('item-unit-price')).toHaveTextContent('200');
  });

  it('normalizes invalid currency values and creates plain items without metadata', async () => {
    const user = userEvent.setup();
    const initial = {
      ...baseForm,
      invoiceItems: [
        {
          ...baseForm.invoiceItems![0],
          invoiceItemSnapshot: { ...baseForm.invoiceItems![0].invoiceItemSnapshot, unitPriceCents: 'invalid' }
        }
      ]
    } as InvoiceFromData;
    render(<InvoiceFormHarness initial={initial} />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'select-currency' }));
    expect(screen.getByTestId('item-unit-price')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: 'select-plain-item' }));
    expect(screen.getByTestId('item-count')).toHaveTextContent('2');
  });

  it('updates an existing payment, appends a missing payment, and ignores invalid input', async () => {
    const user = userEvent.setup();
    const initial = {
      ...baseForm,
      invoicePayments: [{ id: 9, paidAt: '2024-01-01', paymentMethod: PaymentType.cash, amountCents: '50' }]
    } as InvoiceFromData;
    render(<InvoiceFormHarness initial={initial} />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'update-payment' }));
    expect(screen.getByTestId('payment-count')).toHaveTextContent('1');
    expect(screen.getByTestId('payment-amount')).toHaveTextContent('25');
    expect(screen.getByTestId('status')).toHaveTextContent(InvoiceStatus.partiallyPaid);

    await user.click(screen.getByRole('button', { name: 'append-missing-payment' }));
    expect(screen.getByTestId('payment-count')).toHaveTextContent('2');
    expect(screen.getByTestId('status')).toHaveTextContent(InvoiceStatus.paid);

    await user.click(screen.getByRole('button', { name: 'invalid-payment' }));
    expect(screen.getByTestId('payment-count')).toHaveTextContent('2');
  });

  it('propagates a selected custom-field alignment to matching items', async () => {
    const user = userEvent.setup();
    const initial = {
      ...baseForm,
      invoiceItems: [
        {
          ...baseForm.invoiceItems![0],
          customField: { header: 'Code', value: 'old', alignment: 'left', sortOrder: 2 }
        }
      ]
    } as InvoiceFromData;
    render(<InvoiceFormHarness initial={initial} />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'select-item' }));

    expect(screen.getByTestId('second-item-alignment')).toHaveTextContent('right');
    expect(screen.getByTestId('item-count')).toHaveTextContent('2');
  });

  it('handles optional callbacks and undefined form data without mutating persisted actions', async () => {
    const user = userEvent.setup();
    const setInvoiceForm = vi.fn();
    render(<InvoiceForm invoiceForm={undefined} setInvoiceForm={setInvoiceForm} type={InvoiceType.invoice} />, {
      wrapper
    });

    for (const name of [
      'select-business',
      'select-bank',
      'clear-bank',
      'select-style',
      'select-currency',
      'select-item',
      'select-language'
    ]) {
      await user.click(screen.getByRole('button', { name }));
    }

    expect(actionMocks.retrieveXML).not.toHaveBeenCalled();
  });

  it('opens More Actions from the keyboard', async () => {
    const user = userEvent.setup();
    render(<InvoiceFormHarness />, { wrapper });

    await user.tab();
    while (document.activeElement?.getAttribute('aria-label') !== i18n.t('ariaLabel.moreActions')) {
      await user.tab();
    }
    await user.keyboard('{Enter}');

    expect(document.activeElement).toHaveAttribute('aria-label', i18n.t('ariaLabel.moreActions'));
  });

  it('routes dropdown navigation and modal cancellation callbacks', async () => {
    const user = userEvent.setup();
    render(<InvoiceFormHarness />, { wrapper });

    for (const name of ['language', 'business', 'style', 'bank', 'client']) {
      await user.click(screen.getByRole('button', { name: `open-${name}-dropdown` }));
      await user.click(screen.getByRole('button', { name: `close-${name}-dropdown` }));
    }

    await user.click(screen.getByRole('button', { name: /edit-item-1/i }));
    await user.click(screen.getByRole('button', { name: /cancel-item-metadata/i }));
    expect(screen.queryByRole('button', { name: /cancel-item-metadata/i })).not.toBeInTheDocument();
  });
});
