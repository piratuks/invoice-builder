import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { InvoiceStatus } from '../../../../shared/enums/invoiceStatus';
import { InvoiceType } from '../../../../shared/enums/invoiceType';
import type { InvoiceFromData, SignatureForm } from '../../../../shared/types/invoice';
import { store } from '../../../../state/configureStore';
import { NotesSelector } from '../NotesSelector';
import { SignatureSelector } from '../SignatureSelector';
import { StatusSelector } from '../StatusSelector';

vi.mock('../Dropdowns/NoteDropdown', () => ({
  NoteDropdown: ({ onClick }: { onClick: (value: string) => void }) => (
    <button type="button" onClick={() => onClick('Updated note')}>
      save-note
    </button>
  )
}));

vi.mock('../Dropdowns/SignatureDropdown', () => ({
  SignatureDropdown: ({ onClick }: { onClick: (value: SignatureForm) => void }) => (
    <button type="button" onClick={() => onClick({ data: undefined, name: 'Signer', type: 'png', size: 1 })}>
      save-signature
    </button>
  )
}));

vi.mock('../../../../shared/components/inputs/uploadImage/UploadImage', () => ({
  UploadImage: ({ onUpload }: { onUpload: (file?: Blob, filename?: string) => void }) => (
    <button type="button" onClick={() => onUpload()}>
      clear-signature
    </button>
  )
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const invoice = {
  invoiceType: InvoiceType.invoice,
  status: InvoiceStatus.unpaid,
  taxRate: 0,
  invoiceItems: [],
  invoicePayments: [],
  discountAmountCents: '0',
  shippingFeeCents: '0'
} as unknown as InvoiceFromData;

describe('invoice form selectors', () => {
  it('routes each note type to its matching callback', async () => {
    const user = userEvent.setup();
    const onCustomer = vi.fn();
    const onThanks = vi.fn();
    const onTerms = vi.fn();
    render(
      <NotesSelector
        data={{ customerNotes: 'Customer', thanksNotes: 'Thanks', termsConditionNotes: 'Terms' }}
        onCustomerNotesChanged={onCustomer}
        onThanksNotesChanged={onThanks}
        onTermsConditionsNotesChanged={onTerms}
      />,
      { wrapper }
    );

    for (const label of ['CUSTOMER NOTE', 'THANK YOU NOTE', 'TERMS & CONDITIONS']) {
      await user.click(screen.getByText(label));
      await user.click(screen.getByRole('button', { name: /save-note/i }));
    }

    expect(onCustomer).toHaveBeenCalledWith('Updated note');
    expect(onThanks).toHaveBeenCalledWith('Updated note');
    expect(onTerms).toHaveBeenCalledWith('Updated note');
  });

  it('updates invoice and archive statuses', async () => {
    const user = userEvent.setup();
    const onStatus = vi.fn();
    const onArchived = vi.fn();
    const { rerender } = render(
      <StatusSelector invoiceForm={invoice} onStatusChanged={onStatus} onArchivedChanged={onArchived} />,
      { wrapper }
    );

    await user.click(screen.getByRole('switch', { name: /mark as closed/i }));
    await user.click(screen.getByRole('switch', { name: /mark as paid/i }));

    expect(onStatus).toHaveBeenCalledWith(InvoiceStatus.closed);

    rerender(
      <StatusSelector
        invoiceForm={{ ...invoice, status: InvoiceStatus.closed }}
        onStatusChanged={onStatus}
        onArchivedChanged={onArchived}
      />
    );
    await user.click(screen.getByRole('switch', { name: /mark as closed/i }));
    await user.click(screen.getByRole('switch', { name: /archived/i }));

    expect(onStatus).toHaveBeenCalledWith(InvoiceStatus.unpaid);
    expect(onArchived).toHaveBeenCalledWith(true);
  });

  it('opens signature editing and clears an existing signature', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <SignatureSelector
        data={{ signatureName: 'Old', signatureType: 'png', signatureData: new Uint8Array([1]) }}
        onEdit={onEdit}
      />,
      {
        wrapper
      }
    );

    await user.click(screen.getByText('SIGNATURE'));
    await user.click(screen.getByRole('button', { name: /save-signature/i }));
    await user.click(screen.getByRole('button', { name: /clear-signature/i }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Signer' }));
    expect(onEdit).toHaveBeenCalledWith({ data: undefined, size: undefined, type: undefined, name: undefined });
  });
});
