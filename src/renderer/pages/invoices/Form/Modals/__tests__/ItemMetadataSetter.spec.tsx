import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../../i18n';
import { getApi } from '../../../../../shared/api/restApi';
import { InvoiceType } from '../../../../../shared/enums/invoiceType';
import { store } from '../../../../../state/configureStore';
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
});
