import { render, screen } from '@testing-library/react';
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
import { MoreActionDropdown } from '../MoreActionDropdown';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('MoreActionDropdown', () => {
  beforeEach(() => {
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
        ublON: true,
        xrechnungON: true,
        receiptPrintingOn: true,
        presetsON: false,
        reportsON: false,
        createdAt: '',
        updatedAt: ''
      })
    );
  });

  it('fires all invoice export and action callbacks while the drawer is open', async () => {
    const user = userEvent.setup();
    const onExportPDF = vi.fn();
    const onPrintReceipt = vi.fn();
    const onExportPDFUBL = vi.fn();
    const onExportUBLXML = vi.fn();
    const onExportXRechnungXML = vi.fn();
    const onDuplicate = vi.fn();
    const onDelete = vi.fn();
    const onMakeInvoice = vi.fn();

    render(
      <MoreActionDropdown
        type={InvoiceType.invoice}
        isOpen={true}
        isPDFReady={true}
        onExportPDF={onExportPDF}
        onPrintReceipt={onPrintReceipt}
        onExportPDFUBL={onExportPDFUBL}
        onExportUBLXML={onExportUBLXML}
        onExportXRechnungXML={onExportXRechnungXML}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onMakeInvoice={onMakeInvoice}
      />,
      { wrapper }
    );

    await user.click(screen.getByText(i18n.t('common.exportPDF')));
    await user.click(screen.getByText(i18n.t('common.printReceipt')));
    await user.click(screen.getByText(i18n.t('common.exportPDFEmbeddedUBL')));
    await user.click(screen.getByText(i18n.t('common.exportUBLXML')));
    await user.click(screen.getByText(i18n.t('common.exportXRechnungXML')));
    await user.click(screen.getByText(i18n.t('common.duplicate')));
    await user.click(screen.getByText(i18n.t('ariaLabel.delete')));

    expect(onExportPDF).toHaveBeenCalledTimes(1);
    expect(onPrintReceipt).toHaveBeenCalledTimes(1);
    expect(onExportPDFUBL).toHaveBeenCalledTimes(1);
    expect(onExportUBLXML).toHaveBeenCalledTimes(1);
    expect(onExportXRechnungXML).toHaveBeenCalledTimes(1);
    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders the make-invoice action for quote-type forms when enabled', async () => {
    const user = userEvent.setup();
    const onMakeInvoice = vi.fn();

    render(
      <MoreActionDropdown
        type={InvoiceType.quotation}
        isOpen={true}
        isPDFReady={true}
        showMakeInvoice={true}
        onMakeInvoice={onMakeInvoice}
      />,
      { wrapper }
    );

    await user.click(screen.getByText(i18n.t('common.makeInvoice')));

    expect(onMakeInvoice).toHaveBeenCalledTimes(1);
  });
});
