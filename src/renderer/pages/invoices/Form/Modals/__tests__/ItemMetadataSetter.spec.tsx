import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../../i18n';
import { getApi } from '../../../../../shared/api/restApi';
import { Alignment } from '../../../../../shared/enums/alignment';
import { InvoiceType } from '../../../../../shared/enums/invoiceType';
import { store } from '../../../../../state/configureStore';
import { selectToasts } from '../../../../../state/pageSlice';
import { ItemMetadataSetter } from '../ItemMetadataSetter';

vi.mock('../../../../../shared/api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('ItemMetadataSetter', () => {
  const mockApi = { getCustomHeaders: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getCustomHeaders.mockResolvedValue({ success: true, data: [] });
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('does not render dialog content when closed', () => {
    render(<ItemMetadataSetter isOpen={false} type={InvoiceType.invoice} headerOptions={[]} />, { wrapper });

    expect(screen.queryByText(i18n.t('invoices.addItem'))).not.toBeInTheDocument();
  });

  it('pre-fills quantity and unit price and allows saving with only those fields', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ItemMetadataSetter
        isOpen={true}
        type={InvoiceType.invoice}
        headerOptions={[]}
        currQuantity="2"
        currUnitPrice={10}
        onSave={onSave}
      />,
      { wrapper }
    );

    expect(await screen.findByText(i18n.t('invoices.addItem'))).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: i18n.t('common.save') });
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ quantity: 2, unitPrice: 10 }));
  });

  it('requires the value field once a custom field header is entered', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ItemMetadataSetter
        isOpen={true}
        type={InvoiceType.invoice}
        headerOptions={[]}
        currQuantity="1"
        currUnitPrice={5}
        onSave={onSave}
      />,
      { wrapper }
    );

    const headerInput = screen.getByRole('combobox', { name: /custom field header/i });
    await user.type(headerInput, 'Purchase Order{Enter}');

    const saveButton = screen.getByRole('button', { name: i18n.t('common.save') });
    await waitFor(() => expect(saveButton).toBeDisabled());
  });

  it('calls onCancel when the back button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ItemMetadataSetter isOpen={true} type={InvoiceType.invoice} headerOptions={[]} onCancel={onCancel} />, {
      wrapper
    });

    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.back') }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('requires all metadata after a selected alignment is cleared, then saves when restored', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ItemMetadataSetter
        isOpen={true}
        type={InvoiceType.invoice}
        headerOptions={[]}
        currQuantity="3"
        currUnitPrice={25}
        customField={{ header: 'Code', value: 'A-1', sortOrder: 2, alignment: Alignment.right }}
        onSave={onSave}
      />,
      { wrapper }
    );

    const rightAlignment = screen.getByRole('radio', { name: Alignment.right });
    const saveButton = screen.getByRole('button', { name: i18n.t('common.save') });
    await user.click(rightAlignment);
    await waitFor(() => expect(saveButton).toBeDisabled());

    await user.click(rightAlignment);
    await waitFor(() => expect(saveButton).toBeEnabled());
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ header: 'Code', value: 'A-1', sortOrder: 2, alignment: Alignment.right })
    );
  });

  it('renders custom headers returned by the API without duplicating supplied options', async () => {
    const user = userEvent.setup();
    mockApi.getCustomHeaders.mockResolvedValue({
      success: true,
      data: [
        { header: 'Department', sortOrder: 1, alignment: Alignment.left },
        { header: 'Region', sortOrder: 2, alignment: Alignment.center }
      ]
    });

    render(
      <ItemMetadataSetter
        isOpen={true}
        type={InvoiceType.invoice}
        headerOptions={[{ header: 'Department', sortOrder: 1, alignment: Alignment.left }]}
      />,
      { wrapper }
    );

    const headerInput = screen.getByRole('combobox', { name: /custom field header/i });
    await user.click(headerInput);

    expect(await screen.findByRole('option', { name: 'Department' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Region' })).toBeInTheDocument();
    expect(screen.getAllByRole('option', { name: 'Department' })).toHaveLength(1);
  });

  it.each([
    [{ success: false, message: 'Direct failure' }, 'Direct failure'],
    [{ success: false, key: 'common.invalidForm' }, i18n.t('common.invalidForm')]
  ])('reports header retrieval errors', async (response, expectedMessage) => {
    mockApi.getCustomHeaders.mockResolvedValue(response);

    render(<ItemMetadataSetter isOpen={true} type={InvoiceType.invoice} headerOptions={[]} />, { wrapper });

    await waitFor(() =>
      expect(selectToasts(store.getState())).toEqual(
        expect.arrayContaining([expect.objectContaining({ message: expectedMessage, severity: 'error' })])
      )
    );
  });

  it('autofills metadata from a known header and validates required numeric fields', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ItemMetadataSetter
        isOpen={true}
        type={InvoiceType.invoice}
        headerOptions={[{ header: 'Department', sortOrder: 4, alignment: Alignment.center }]}
        onSave={onSave}
      />,
      { wrapper }
    );

    const headerInput = screen.getByRole('combobox', { name: /custom field header/i });
    await user.click(headerInput);
    await user.click(await screen.findByRole('option', { name: 'Department' }));
    await user.type(screen.getByRole('textbox', { name: i18n.t('invoices.customFieldValue') }), 'Sales');

    const quantity = screen.getByRole('textbox', { name: i18n.t('invoices.quantity') });
    await user.clear(quantity);
    expect(await screen.findByText(i18n.t('common.fieldRequired'))).toBeInTheDocument();
    await user.type(quantity, '2');

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ header: 'Department', value: 'Sales', sortOrder: 4, alignment: Alignment.center })
    );
  });

  it.each([Alignment.left, Alignment.center])('toggles %s alignment off and on', async alignment => {
    const user = userEvent.setup();
    render(
      <ItemMetadataSetter
        isOpen={true}
        type={InvoiceType.invoice}
        headerOptions={[]}
        customField={{ header: 'Code', value: 'A', sortOrder: 1, alignment }}
      />,
      { wrapper }
    );

    const radio = screen.getByRole('radio', { name: alignment });
    await user.click(radio);
    await waitFor(() => expect(radio).not.toBeChecked());
    await user.click(radio);
    await waitFor(() => expect(radio).toBeChecked());
  });
});
