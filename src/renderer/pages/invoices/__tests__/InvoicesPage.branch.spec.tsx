import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import type { Invoice } from '../../../shared/types/invoice';
import { store } from '../../../state/configureStore';
import { setSettings } from '../../../state/pageSlice';
import { InvoicesPage } from '../index';

const mocks = vi.hoisted(() => ({
  exportExcel: vi.fn().mockResolvedValue(undefined),
  defaultAdd: vi.fn(),
  edit: vi.fn(),
  change: vi.fn(),
  remove: vi.fn(),
  duplicate: vi.fn(),
  validationResults: [] as unknown[]
}));

type MockCrudProps = {
  onAddClick: (defaultOnAdd: () => void) => void;
  renderCustomButtons: () => ReactNode;
  exportExcelHandler: (invoices: Invoice[]) => Promise<void>;
  validateAndNormalize: (data: unknown) => Promise<unknown>;
  renderListItem: (item: Invoice, selectedItem: Invoice | undefined, onEdit: (item: Invoice) => void) => ReactNode;
  form: (args: {
    item: Invoice;
    onChange: (data: unknown) => void;
    onDelete?: (id: number) => void;
    onDuplicate?: (id: number) => void;
  }) => ReactNode;
};

vi.mock('../../../shared/utils/fileFunctions', () => ({ exportExcel: mocks.exportExcel }));
vi.mock('../Dropdowns/NewActionDropdown', () => ({
  NewActionDropdown: ({ onNew, onNewFromPreset }: { onNew: () => void; onNewFromPreset: (data: unknown) => void }) => (
    <div>
      <button onClick={onNew}>new-default</button>
      <button onClick={() => onNewFromPreset({ id: 3, name: 'Preset' })}>new-preset</button>
    </div>
  )
}));
vi.mock('../Form/EditPreviewToggle', () => ({ EditPreviewToggle: () => <div data-testid="mode-toggle" /> }));
vi.mock('../List', () => ({ List: () => <div data-testid="invoice-list" /> }));
vi.mock('../Form', () => ({
  Form: ({ handleChange, handleDelete, handleDuplicate }: Record<string, (...args: unknown[]) => void>) => (
    <div>
      <button onClick={() => handleChange({ invoice: { invalid: true }, isFormValid: false })}>invalid-change</button>
      <button
        onClick={() =>
          handleChange({
            invoice: { invoiceType: InvoiceType.invoice, invoiceItems: [], invoicePayments: [] },
            isFormValid: true
          })
        }
      >
        valid-change
      </button>
      <button onClick={() => handleDelete(7)}>delete-form</button>
      <button onClick={() => handleDuplicate(7, InvoiceType.quotation)}>duplicate-form</button>
    </div>
  )
}));

vi.mock('../../../shared/components/layout/crudPage/CRUDPageRTK', () => ({
  CRUDPageRTK: (props: MockCrudProps) => {
    const sampleInvoice = {
      id: 7,
      invoiceType: InvoiceType.invoice,
      invoiceNumber: 'INV-7',
      invoiceItems: [],
      invoicePayments: [],
      invoiceAttachments: [],
      invoiceBusinessSnapshot: { businessName: 'Business' },
      invoiceClientSnapshot: { clientName: 'Client' },
      invoiceCurrencySnapshot: {
        currencyCode: 'USD',
        currencySymbol: '$',
        currencyFormat: '{symbol}{amount}',
        currencyAmountFormat: '1,234.56'
      },
      invoiceCustomization: { color: '#000000' }
    } as unknown as Invoice;
    return (
      <div>
        <button type="button" onClick={() => props.onAddClick(mocks.defaultAdd)}>
          crud-add
        </button>
        <button type="button" onClick={() => void props.exportExcelHandler([sampleInvoice])}>
          crud-export
        </button>
        <button type="button" onClick={() => void props.validateAndNormalize({})}>
          crud-validate
        </button>
        <button
          type="button"
          onClick={() =>
            void Promise.all([
              props.validateAndNormalize({ invoiceType: InvoiceType.invoice }),
              props.validateAndNormalize({ invalid: true })
            ]).then(results => mocks.validationResults.push(...results))
          }
        >
          validate-both
        </button>
        {props.renderCustomButtons()}
        {props.renderListItem(sampleInvoice, sampleInvoice, mocks.edit)}
        {props.form({
          item: sampleInvoice,
          onChange: mocks.change,
          onDelete: mocks.remove,
          onDuplicate: mocks.duplicate
        })}
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
    mocks.validationResults.length = 0;
    store.dispatch(setSettings({ presetsON: false } as never));
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

  it('forwards form actions and accepts only normalized invoice data', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage type={InvoiceType.invoice} />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'invalid-change' }));
    await user.click(screen.getByRole('button', { name: 'valid-change' }));
    await user.click(screen.getByRole('button', { name: 'delete-form' }));
    await user.click(screen.getByRole('button', { name: 'duplicate-form' }));
    await user.click(screen.getByRole('button', { name: 'validate-both' }));

    expect(mocks.change).toHaveBeenCalledTimes(1);
    expect(mocks.remove).toHaveBeenCalledWith(7);
    expect(mocks.duplicate).toHaveBeenCalledWith(7);
    await waitFor(() =>
      expect(mocks.validationResults).toEqual(
        expect.arrayContaining([expect.objectContaining({ invoiceType: InvoiceType.invoice }), undefined])
      )
    );
  });

  it('opens add actions and starts default and preset flows when presets are enabled', async () => {
    const user = userEvent.setup();
    store.dispatch(setSettings({ presetsON: true } as never));
    render(<InvoicesPage type={InvoiceType.quotation} />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'crud-add' }));
    await user.click(screen.getByRole('button', { name: 'new-default' }));
    await user.click(screen.getByRole('button', { name: 'crud-add' }));
    await user.click(screen.getByRole('button', { name: 'new-preset' }));

    expect(mocks.defaultAdd).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
  });
});
