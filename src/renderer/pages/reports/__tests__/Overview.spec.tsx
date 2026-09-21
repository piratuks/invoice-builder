import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { AmountFormat } from '../../../shared/enums/amountFormat';
import { DateFormat } from '../../../shared/enums/dateFormat';
import { Language } from '../../../shared/enums/language';
import { ReportDateType } from '../../../shared/enums/reportDateType';
import type { Invoice, InvoicesByCurrency } from '../../../shared/types/invoice';
import { store } from '../../../state/configureStore';
import { setSettings } from '../../../state/pageSlice';
import { Overview } from '../Overview';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

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
      ublON: false,
      xrechnungON: false,
      receiptPrintingOn: false,
      presetsON: false,
      reportsON: true,
      createdAt: '',
      updatedAt: ''
    })
  );
});

describe('reports Overview', () => {
  it('shows the empty state when there is no data for the selected currency', () => {
    render(
      <Overview
        reportDateType={ReportDateType.issuedAt}
        currencyCode="USD"
        groupedMeta={{ groups: {}, invoices: [] }}
        dates={{ from: new Date().toISOString(), to: new Date().toISOString() }}
      />,
      { wrapper }
    );

    expect(screen.getByText(i18n.t('reports.noItems'))).toBeInTheDocument();
  });

  it('renders the currency dashboard and charts when data is present', () => {
    const groups: InvoicesByCurrency = {
      USD: {
        currencyCode: 'USD',
        currencySymbol: '$',
        totalAmount: 100,
        totalAmountPaid: 100,
        balanceDue: 0,
        invoiceCount: 1,
        overdueCount: 0,
        collectionRate: 1,
        avgPerInvoice: 100,
        issuedAt: new Date().toISOString(),
        currencyId: 1
      }
    };
    const invoices: Partial<Invoice>[] = [
      {
        id: 1,
        currencyId: 1,
        issuedAt: new Date().toISOString(),
        taxRate: 0,
        invoiceItems: [],
        discountAmountCents: '0',
        shippingFeeCents: '0',
        surchargeAmountCents: '0',
        invoiceCurrencySnapshot: { currencySubunit: 100, currencyCode: 'USD', currencySymbol: '$', parentInvoiceId: 1 }
      }
    ];

    render(
      <Overview
        reportDateType={ReportDateType.issuedAt}
        currencyCode="USD"
        groupedMeta={{ groups, invoices: invoices as Invoice[] }}
        dates={{
          from: new Date(Date.now() - 86400000).toISOString(),
          to: new Date(Date.now() + 86400000).toISOString()
        }}
      />,
      { wrapper }
    );

    expect(screen.getByText(i18n.t('reports.currencyDashboard', { currency: 'USD' }))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('reports.noItems'))).not.toBeInTheDocument();
  });
});
