import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { DateFormat } from '../../../../shared/enums/dateFormat';
import { InvoiceType } from '../../../../shared/enums/invoiceType';
import type { InvoiceFromData } from '../../../../shared/types/invoice';
import type { Settings } from '../../../../shared/types/settings';
import { ClientInfo } from '../ClientInfo';
import { InvoiceInformationInfo } from '../InvoiceInformationInfo';
import { PaymentInfo } from '../PaymentInfo';

vi.mock('@react-pdf/renderer', () => ({
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  View: ({ children }: { children?: ReactNode }) => <div>{children}</div>
}));

vi.mock('../QRCodeInfo', () => ({
  QRCodeInfo: ({ qrCodeUrl }: { qrCodeUrl?: string }) => <div data-testid="qr-code">{qrCodeUrl}</div>
}));

const settings = { dateFormat: DateFormat.MMddyyyy } as Settings;

describe('Preview information branches', () => {
  it('renders every populated client detail and omits absent optional details', () => {
    const { rerender } = render(
      <ClientInfo
        billToLabel="Bill to"
        invoiceForm={{ invoiceClientSnapshot: { clientName: 'Ada Lovelace' } } as InvoiceFromData}
      />
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByText('ada@example.test')).not.toBeInTheDocument();

    rerender(
      <ClientInfo
        billToLabel="Bill to"
        invoiceForm={
          {
            invoiceClientSnapshot: {
              clientName: 'Ada Lovelace',
              clientAddress: '12 Computing Lane',
              clientEmail: 'ada@example.test',
              clientPhone: '+44 20 0000 0000',
              clientCode: 'CLIENT-42',
              clientVatCode: 'GB123456789',
              clientAdditional: 'Purchase order PO-9'
            }
          } as InvoiceFromData
        }
      />
    );

    for (const value of [
      '12 Computing Lane',
      'ada@example.test',
      '+44 20 0000 0000',
      'CLIENT-42',
      'GB123456789',
      'Purchase order PO-9'
    ]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it('selects legacy payment information and handles its empty branch', () => {
    const invoiceForm = {
      invoiceBusinessSnapshot: { businessPaymentInformation: 'Pay within 14 days' }
    } as InvoiceFromData;
    const { container, rerender } = render(
      <PaymentInfo invoiceForm={invoiceForm} paymentInfoLabel="Payment" source="legacyBusiness" />
    );

    expect(screen.getByText('Pay within 14 days')).toBeInTheDocument();

    rerender(<PaymentInfo invoiceForm={{} as InvoiceFromData} paymentInfoLabel="Payment" source="legacyBusiness" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders populated bank fields with a QR code and returns nothing without a bank snapshot', () => {
    const bank = {
      accountHolder: 'Ada Consulting Ltd',
      bankName: 'Analytical Bank',
      sortOrder: '10-20-30',
      accountNumber: '12345678',
      swiftCode: 'ANLYGB2L',
      routingNumber: '021000021',
      branchCode: 'LON-01',
      address: '1 Bank Street',
      upiCode: 'ada@upi'
    };
    const { container, rerender } = render(
      <PaymentInfo
        invoiceForm={{ invoiceBankSnapshot: bank } as InvoiceFromData}
        paymentInfoLabel="Payment"
        qrCodeUrl="qr://payment"
      />
    );

    Object.values(bank).forEach(value => expect(screen.getByText(value)).toBeInTheDocument());
    expect(screen.getByTestId('qr-code')).toHaveTextContent('qr://payment');

    rerender(<PaymentInfo invoiceForm={{ invoiceBankSnapshot: {} } as InvoiceFromData} paymentInfoLabel="Payment" />);
    expect(screen.getByText(/Payment/)).toBeInTheDocument();
    expect(screen.getByTestId('qr-code')).toBeEmptyDOMElement();

    rerender(<PaymentInfo invoiceForm={{} as InvoiceFromData} paymentInfoLabel="Payment" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('switches invoice labels and conditionally renders title and dates', () => {
    const labels: ComponentProps<typeof InvoiceInformationInfo>['labels'] = {
      invoiceNoLabel: 'Invoice no.',
      quoteNoLabel: 'Quote no.',
      dueDateLabel: 'Due date',
      dateLabel: 'Date',
      pdfQUOTELabel: 'Quotation',
      pdfINVOICELabel: 'Invoice'
    };
    const invoiceForm = {
      invoiceType: InvoiceType.invoice,
      invoicePrefix: 'INV-',
      invoiceNumber: '1042',
      invoiceSuffix: '-A',
      issuedAt: '2026-01-15',
      dueDate: '2026-02-15'
    } as InvoiceFromData;
    const { rerender } = render(
      <InvoiceInformationInfo
        invoiceForm={invoiceForm}
        storeSettings={settings}
        labels={labels}
        showTitle
        showInvoiceLabel
      />
    );

    expect(screen.getByText('Invoice')).toBeInTheDocument();
    expect(screen.getByText(/Invoice no\./)).toBeInTheDocument();
    expect(screen.getByText('01/15/2026')).toBeInTheDocument();
    expect(screen.getByText('02/15/2026')).toBeInTheDocument();

    rerender(
      <InvoiceInformationInfo
        invoiceForm={{ ...invoiceForm, invoiceType: InvoiceType.quotation }}
        labels={labels}
        showInvoiceLabel
      />
    );

    expect(screen.getByText(/Quote no\./)).toBeInTheDocument();
    expect(screen.queryByText('Date:')).not.toBeInTheDocument();
    expect(screen.queryByText('Due date:')).not.toBeInTheDocument();
    expect(screen.queryByText('Quotation')).not.toBeInTheDocument();
  });
});
