import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../../i18n';
import { AmountFormat } from '../../../../../shared/enums/amountFormat';
import { DateFormat } from '../../../../../shared/enums/dateFormat';
import { InvoiceType } from '../../../../../shared/enums/invoiceType';
import { Language } from '../../../../../shared/enums/language';
import { store } from '../../../../../state/configureStore';
import { setSettings } from '../../../../../state/pageSlice';
import { InvoiceInformationDropdown } from '../InvoiceInformationDropdown';

const execute = vi.fn();
let resolveSequence: ((value: unknown) => void) | undefined;
let rejectSequence: ((reason: unknown) => void) | undefined;

vi.mock('../../../../../shared/api/invoicesApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../../shared/api/invoicesApi')>();
  return {
    ...actual,
    useLazyGetNextSequenceQuery: () => {
      execute.mockImplementation(() => ({
        unwrap: () =>
          new Promise((resolve, reject) => {
            resolveSequence = resolve;
            rejectSequence = reject;
          })
      }));
      return [execute, { isFetching: false }];
    }
  };
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const information = {
  businessId: 1,
  clientId: 2,
  invoiceType: InvoiceType.invoice,
  issuedAt: '2026-09-21',
  invoiceNumber: '',
  dueDate: '2026-10-21'
};

describe('InvoiceInformationDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveSequence = undefined;
    rejectSequence = undefined;
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
        invoicePrefix: 'INV-',
        invoiceSuffix: '-US',
        createdAt: '',
        updatedAt: ''
      })
    );
  });

  it('retrieves and applies the next sequence before saving edited invoice information', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<InvoiceInformationDropdown isOpen={true} information={information} onClick={onClick} />, { wrapper });

    await waitFor(() => expect(execute).toHaveBeenCalled());
    await act(async () => {
      resolveSequence?.({ formattedSequence: '000042' });
    });

    const numberInput = screen.getByRole('textbox', { name: /invoice number/i });
    await waitFor(() => expect(numberInput).toHaveValue('000042'));
    const prefixInput = screen.getByRole('textbox', { name: /invoice prefix/i });
    await user.clear(prefixInput);
    await user.type(prefixInput, 'BILL-');
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ invoiceNumber: '000042', invoicePrefix: 'BILL-' }));
  });

  it('keeps a manually entered number when a sequence response arrives', async () => {
    const user = userEvent.setup();

    render(<InvoiceInformationDropdown isOpen={true} information={information} />, { wrapper });

    const numberInput = screen.getByRole('textbox', { name: /invoice number/i });
    await user.type(numberInput, 'MANUAL-7');
    await act(async () => {
      resolveSequence?.({ formattedSequence: '000043' });
    });

    await waitFor(() => expect(numberInput).toHaveValue('MANUAL-7'));
  });

  it('handles sequence failures with a message or translation key', async () => {
    render(<InvoiceInformationDropdown isOpen={true} information={information} />, { wrapper });

    await waitFor(() => expect(execute).toHaveBeenCalled());
    await act(async () => {
      rejectSequence?.({ message: 'Sequence unavailable' });
    });
    await act(async () => {
      rejectSequence?.({ key: 'common.error' });
    });

    expect(typeof rejectSequence).toBe('function');
  });

  it('uses quotation labels and existing prefixes and suffixes', () => {
    render(
      <InvoiceInformationDropdown
        isOpen={true}
        information={{
          ...information,
          id: 9,
          invoiceType: InvoiceType.quotation,
          invoiceNumber: 'Q-9',
          invoicePrefix: 'Q-',
          invoiceSuffix: '-DRAFT'
        }}
      />,
      { wrapper }
    );

    expect(screen.getByRole('textbox', { name: /quote prefix/i })).toHaveValue('Q-');
    expect(screen.getByRole('textbox', { name: /quote number/i })).toHaveValue('Q-9');
    expect(screen.getByRole('textbox', { name: /quote suffix/i })).toHaveValue('-DRAFT');
    expect(execute).not.toHaveBeenCalled();
  });
});
