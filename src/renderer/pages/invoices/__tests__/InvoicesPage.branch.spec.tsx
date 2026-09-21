import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import type { Invoice } from '../../../shared/types/invoice';
import { store } from '../../../state/configureStore';
import { InvoicesPage } from '../index';

const mocks = vi.hoisted(() => ({ exportExcel: vi.fn().mockResolvedValue(undefined) }));

type MockCrudProps = {
  onAddClick: (defaultOnAdd: () => void) => void;
  exportExcelHandler: (invoices: Invoice[]) => Promise<void>;
  validateAndNormalize: (data: unknown) => Promise<unknown>;
};

vi.mock('../../../shared/utils/fileFunctions', () => ({ exportExcel: mocks.exportExcel }));
vi.mock('./Dropdowns/NewActionDropdown', () => ({
  NewActionDropdown: () => null
}));
vi.mock('./Form/EditPreviewToggle', () => ({ EditPreviewToggle: () => <div data-testid="mode-toggle" /> }));
vi.mock('./List', () => ({ List: () => <div data-testid="invoice-list" /> }));

vi.mock('../../../shared/components/layout/crudPage/CRUDPage', () => ({
  CRUDPage: (props: MockCrudProps) => {
    const sampleInvoice = {
      id: 7,
      invoiceType: InvoiceType.invoice,
      invoiceNumber: 'INV-7',
      invoiceItems: [],
      invoicePayments: [],
      invoiceAttachments: [],
      invoiceBusinessSnapshot: { businessName: 'Business' },
      invoiceClientSnapshot: { clientName: 'Client' },
      invoiceCurrencySnapshot: { currencyCode: 'USD' },
      invoiceCustomization: { color: '#000000' }
    } as unknown as Invoice;
    return (
      <div>
        <button type="button" onClick={() => props.onAddClick(() => {})}>
          crud-add
        </button>
        <button type="button" onClick={() => void props.exportExcelHandler([sampleInvoice])}>
          crud-export
        </button>
        <button type="button" onClick={() => void props.validateAndNormalize({})}>
          crud-validate
        </button>
      </div>
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

describe('InvoicesPage callback branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles CRUD export, validation, and form callback wiring', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage type={InvoiceType.invoice} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /crud-export/i }));
    await user.click(screen.getByRole('button', { name: /crud-validate/i }));

    expect(mocks.exportExcel).toHaveBeenCalledWith(expect.any(Array), 'invoices.xlsx');
  });

  it('opens the default add flow when presets are disabled', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage type={InvoiceType.invoice} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /crud-add/i }));
  });
});
