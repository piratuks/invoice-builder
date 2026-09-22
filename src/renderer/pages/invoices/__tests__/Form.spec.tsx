import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { AmountFormat } from '../../../shared/enums/amountFormat';
import { DateFormat } from '../../../shared/enums/dateFormat';
import { FontFamily } from '../../../shared/enums/fontFamily';
import { InvoiceFormMode } from '../../../shared/enums/invoiceFormMode';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import { Language } from '../../../shared/enums/language';
import { PageFormat } from '../../../shared/enums/pageFormat';
import { SizeType } from '../../../shared/enums/sizeType';
import { TableHeaderStyle } from '../../../shared/enums/tableHeaderStyle';
import { TableRowStyle } from '../../../shared/enums/tableRowStyle';
import type { Invoice } from '../../../shared/types/invoice';
import type { Preset } from '../../../shared/types/preset';
import { store } from '../../../state/configureStore';
import { setSettings } from '../../../state/pageSlice';
import { Form } from '../Form';

const mockInvoiceForm = vi.fn();
const mockInvoicesPreview = vi.fn();
const styleProfileMocks = vi.hoisted(() => ({
  trigger: vi.fn()
}));

type MockInvoiceFormProps = { invoiceForm?: { businessId?: number } };
type MockPreviewProps = {
  invoiceForm?: { language?: string };
  onSaveProfile: (data: Record<string, unknown>) => void;
};

vi.mock('../../../shared/api/styleProfilesApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../shared/api/styleProfilesApi')>();
  return {
    ...actual,
    useAddStyleProfileMutation: () => [styleProfileMocks.trigger, { isLoading: false }]
  };
});

vi.mock('../Form/index', () => ({
  InvoiceForm: ({ invoiceForm }: MockInvoiceFormProps) => {
    mockInvoiceForm(invoiceForm);
    return <div data-testid="invoice-form">{invoiceForm?.businessId ?? 'no-business'}</div>;
  }
}));

vi.mock('../Preview', () => ({
  InvoicesPreview: ({ invoiceForm, onSaveProfile }: MockPreviewProps) => {
    mockInvoicesPreview(invoiceForm);
    return (
      <button type="button" onClick={() => onSaveProfile({ name: 'Saved profile', color: '#123456' })}>
        {invoiceForm?.language ?? 'preview'}
      </button>
    );
  }
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/invoices']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('invoices Form wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        styleProfilesON: true,
        ublON: false,
        xrechnungON: false,
        receiptPrintingOn: false,
        presetsON: true,
        reportsON: false,
        createdAt: '',
        updatedAt: ''
      })
    );
  });

  it('renders the edit-mode invoice form', async () => {
    render(<Form type={InvoiceType.invoice} mode={InvoiceFormMode.edit} />, { wrapper });

    await waitFor(() => expect(mockInvoiceForm).toHaveBeenCalled());
    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
  });

  it('renders the preview mode component', async () => {
    render(<Form type={InvoiceType.invoice} mode={InvoiceFormMode.preview} />, { wrapper });

    await waitFor(() => expect(mockInvoicesPreview).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /en/i })).toBeInTheDocument();
  });

  it('applies a preset when one is supplied', async () => {
    const preset: Preset = {
      id: 1,
      name: 'Starter preset',
      businessId: 88,
      clientId: 99,
      currencyId: 101,
      language: Language.en,
      isArchived: false,
      createdAt: '',
      updatedAt: ''
    };

    render(<Form type={InvoiceType.invoice} mode={InvoiceFormMode.edit} preset={preset} />, { wrapper });

    await waitFor(() => expect(mockInvoiceForm).toHaveBeenCalled());
    expect(mockInvoiceForm.mock.calls.at(-1)?.[0]?.businessId).toBe(88);
    expect(mockInvoiceForm.mock.calls.at(-1)?.[0]?.clientId).toBe(99);
  });

  it('applies every populated preset section to an existing invoice', async () => {
    const invoice = {
      id: 5,
      invoiceType: InvoiceType.invoice,
      businessId: 1,
      clientId: 2,
      currencyId: 3,
      layoutId: 4,
      issuedAt: '2026-01-01',
      invoiceNumber: 'INV-5',
      language: Language.en,
      invoiceItems: [{ id: 1 }],
      invoicePayments: [],
      invoiceAttachments: [],
      invoiceBusinessSnapshot: { businessName: 'Old business' },
      invoiceClientSnapshot: { clientName: 'Old client' },
      invoiceBankSnapshot: { name: 'Old bank' },
      invoiceCurrencySnapshot: { currencyCode: 'USD', currencySymbol: '$', currencySubunit: 100 },
      invoiceStyleProfileSnapshot: { styleProfileName: 'Old profile' },
      invoiceCustomization: { color: '#000000' }
    } as unknown as Invoice;
    const preset = {
      businessId: 10,
      businessName: 'New business',
      businessAddress: 'Address',
      businessRole: 'Seller',
      businessShortName: 'NB',
      businessEmail: 'business@example.test',
      businessPhone: '123',
      businessAdditional: 'Additional',
      businessLogo: 'logo',
      businessFileSize: 10,
      businessFileType: 'image/png',
      businessFileName: 'logo.png',
      businessVatCode: 'VAT',
      clientId: 20,
      clientName: 'New client',
      clientAddress: 'Client address',
      clientEmail: 'client@example.test',
      clientPhone: '456',
      clientCode: 'CLIENT',
      clientAdditional: 'Client additional',
      clientVatCode: 'CLIENT-VAT',
      bankId: 30,
      bankLabel: 'Primary bank',
      bankName: 'Example bank',
      accountNumber: '1234',
      swiftCode: 'SWIFT',
      address: 'Bank address',
      branchCode: 'BRANCH',
      type: 'checking',
      routingNumber: 'ROUTE',
      sortOrder: 2,
      accountHolder: 'Holder',
      qrCode: 'qr',
      qrCodeFileSize: 11,
      qrCodeFileType: 'image/png',
      qrCodeFileName: 'qr.png',
      currencyFormat: 'USD',
      currencyId: 40,
      currencyCode: 'EUR',
      currencySymbol: '€',
      currencySubunit: 100,
      styleProfilesId: 50,
      layoutId: 60,
      layoutSchema: '{"version":2}',
      styleProfileName: 'Modern',
      styleProfileColor: '#123456',
      styleProfileLogoSize: SizeType.large,
      styleProfileFontSize: SizeType.small,
      styleProfileFontFamily: FontFamily.roboto,
      styleProfileTableHeaderStyle: TableHeaderStyle.dark,
      styleProfileTableRowStyle: TableRowStyle.bordered,
      styleProfilePageFormat: PageFormat.letter,
      styleProfileLabelUpperCase: true,
      styleProfileWatermarkFileName: 'watermark.png',
      styleProfileWatermarkFileType: 'image/png',
      styleProfileWatermarkFileSize: 12,
      styleProfileWatermarkFileData: 'watermark',
      styleProfilePaidWatermarkFileName: 'paid.png',
      styleProfilePaidWatermarkFileType: 'image/png',
      styleProfilePaidWatermarkFileSize: 13,
      styleProfilePaidWatermarkFileData: 'paid',
      styleProfileShowQuantity: false,
      styleProfileShowUnit: false,
      styleProfileShowRowNo: false,
      styleProfileFieldSortOrders: { item: 1 },
      styleProfilePdfTexts: { invoice: 'Invoice' },
      customerNotes: 'Customer note',
      thanksNotes: 'Thanks',
      termsConditionNotes: 'Terms',
      language: Language.de,
      signatureData: 'signature',
      signatureSize: SizeType.large,
      signatureType: 'image/png',
      signatureName: 'Signer'
    } as unknown as Preset;

    render(<Form type={InvoiceType.invoice} mode={InvoiceFormMode.edit} invoice={invoice} preset={preset} />, {
      wrapper
    });

    await waitFor(() => expect(mockInvoiceForm.mock.calls.at(-1)?.[0]?.businessId).toBe(10));
    const form = mockInvoiceForm.mock.calls.at(-1)?.[0];
    expect(form.invoiceBusinessSnapshot.businessName).toBe('New business');
    expect(form.invoiceClientSnapshot.clientName).toBe('New client');
    expect(form.invoiceBankSnapshot.name).toBe('Primary bank');
    expect(form.invoiceCurrencySnapshot.currencyCode).toBe('EUR');
    expect(form.invoiceLayoutSnapshot.layoutSchema).toBe('{"version":2}');
    expect(form.invoiceCustomization).toEqual(expect.objectContaining({ color: '#123456', showQuantity: false }));
  });

  it('falls back to existing snapshot values for sparse named preset sections', async () => {
    const invoice = {
      id: 6,
      invoiceType: InvoiceType.invoice,
      businessId: 1,
      clientId: 2,
      currencyId: 3,
      layoutId: 4,
      issuedAt: '2026-01-01',
      invoiceNumber: 'INV-6',
      language: Language.en,
      invoiceItems: [{ id: 1 }],
      invoiceBusinessSnapshot: { businessName: 'Old business', businessAddress: 'Old address' },
      invoiceClientSnapshot: { clientName: 'Old client', clientAddress: 'Old client address' },
      invoiceBankSnapshot: { name: 'Old bank', bankName: 'Old bank name' },
      invoiceCurrencySnapshot: { currencyCode: 'USD', currencySymbol: '$', currencySubunit: 100 },
      invoiceStyleProfileSnapshot: { styleProfileName: 'Old profile' },
      invoiceCustomization: { color: '#000000', fieldSortOrders: { item: 2 } }
    } as unknown as Invoice;
    const preset = {
      businessName: 'Named business',
      clientName: 'Named client',
      bankLabel: 'Named bank',
      currencyCode: 'GBP',
      styleProfileName: 'Named profile'
    } as unknown as Preset;

    render(<Form type={InvoiceType.invoice} mode={InvoiceFormMode.edit} invoice={invoice} preset={preset} />, {
      wrapper
    });

    await waitFor(() => expect(mockInvoiceForm.mock.calls.at(-1)?.[0]?.invoiceBusinessSnapshot).toBeDefined());
    const form = mockInvoiceForm.mock.calls.at(-1)?.[0];
    expect(form.invoiceBusinessSnapshot.businessAddress).toBe('Old address');
    expect(form.invoiceClientSnapshot.clientAddress).toBe('Old client address');
    expect(form.invoiceBankSnapshot.bankName).toBe('Old bank name');
    expect(form.invoiceCurrencySnapshot.currencySymbol).toBe('$');
    expect(form.invoiceCustomization.color).toBe('#000000');
  });

  it('creates a style profile from preview and handles service errors', async () => {
    const user = userEvent.setup();
    const findSaveProfileButton = () => screen.findByRole('button', { name: /en/i });

    styleProfileMocks.trigger.mockResolvedValueOnce({ error: { message: 'Profile failed' } });
    render(<Form type={InvoiceType.quotation} mode={InvoiceFormMode.preview} />, { wrapper });

    await user.click(await findSaveProfileButton());
    await waitFor(() => expect(styleProfileMocks.trigger).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(store.getState().pageSlice.toasts.at(-1)?.message).toBe('Profile failed'));

    styleProfileMocks.trigger.mockResolvedValueOnce({ error: { key: 'error.failedToLoad' } });
    await user.click(await findSaveProfileButton());
    await waitFor(() => expect(styleProfileMocks.trigger).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(store.getState().pageSlice.toasts.at(-1)?.message).toBe(i18n.t('error.failedToLoad')));
  });
});
