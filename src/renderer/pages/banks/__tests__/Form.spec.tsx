import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import type { Bank } from '../../../shared/types/bank';
import { store } from '../../../state/configureStore';
import { Form } from '../Form';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('banks Form', () => {
  it('reports an invalid form when the required name field is empty', async () => {
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('becomes valid once a name is entered and reports the updated bank data', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'Swedbank');

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ isFormValid: true, bank: expect.objectContaining({ name: 'Swedbank' }) })
      )
    );
  });

  it('shows a validation error for an invalid swift code and marks the form invalid', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'Swedbank');
    await user.type(screen.getByRole('textbox', { name: i18n.t('common.swiftCode') }), 'INVALID!!');

    expect(await screen.findByText(i18n.t('common.swiftCodeInvalid'))).toBeInTheDocument();
    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('shows validation errors for invalid accountNumber, sortOrder, branchCode, routingNumber and upiCode', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'Swedbank');

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.accountNumber') }), '!!');
    expect(await screen.findByText(i18n.t('common.accountNumberInvalid'))).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.sortOrder') }), '1');
    expect(await screen.findByText(i18n.t('common.sortCodeInvalid'))).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.branchCode') }), '12');
    expect(await screen.findByText(i18n.t('common.branchCodeInvalid'))).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.routingNumber') }), '123');
    expect(await screen.findByText(i18n.t('common.routingNumberInvalid'))).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.upiCode') }), 'not-a-valid-upi');
    expect(await screen.findByText(i18n.t('common.upiCodeInvalid'))).toBeInTheDocument();

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('pre-fills the form fields from an existing bank', () => {
    const bank: Bank = {
      id: 1,
      name: 'Existing Bank',
      bankName: 'Existing Bank Corp',
      accountNumber: '123456789',
      swiftCode: 'HABALT22',
      address: '',
      branchCode: '',
      type: '',
      routingNumber: '',
      accountHolder: '',
      sortOrder: '',
      upiCode: '',
      isArchived: false,
      invoiceCount: 0,
      quotesCount: 0
    } as Bank;

    render(<Form bank={bank} />, { wrapper });

    expect(screen.getByRole('textbox', { name: i18n.t('common.name') })).toHaveValue('Existing Bank');
    expect(screen.getByRole('textbox', { name: i18n.t('common.bankName') })).toHaveValue('Existing Bank Corp');
  });

  it('toggles the archived switch', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(<Form handleChange={handleChange} />, { wrapper });

    const archivedSwitch = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(archivedSwitch).not.toBeChecked();

    await user.click(archivedSwitch);

    expect(archivedSwitch).toBeChecked();
  });
});
