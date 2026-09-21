import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { AmountFormat } from '../../../shared/enums/amountFormat';
import { DateFormat } from '../../../shared/enums/dateFormat';
import { InvoiceFormMode } from '../../../shared/enums/invoiceFormMode';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import { Language } from '../../../shared/enums/language';
import type { Preset } from '../../../shared/types/preset';
import { store } from '../../../state/configureStore';
import { setSettings } from '../../../state/pageSlice';
import { Form } from '../Form';

const mockInvoiceForm = vi.fn();
const mockInvoicesPreview = vi.fn();

type MockInvoiceFormProps = { invoiceForm?: { businessId?: number } };
type MockPreviewProps = { invoiceForm?: { language?: string } };

vi.mock('../Form/index', () => ({
  InvoiceForm: ({ invoiceForm }: MockInvoiceFormProps) => {
    mockInvoiceForm(invoiceForm);
    return <div data-testid="invoice-form">{invoiceForm?.businessId ?? 'no-business'}</div>;
  }
}));

vi.mock('../Preview', () => ({
  InvoicesPreview: ({ invoiceForm }: MockPreviewProps) => {
    mockInvoicesPreview(invoiceForm);
    return <button type="button">{invoiceForm?.language ?? 'preview'}</button>;
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
});
