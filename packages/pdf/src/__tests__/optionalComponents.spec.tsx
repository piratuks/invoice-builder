import { InvoiceStatus, SizeType, type InvoiceCustomization } from '@invoice-builder/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InvoiceAdd } from '@invoice-builder/contracts';
import type { PdfTexts } from '../types.js';
import { BusinessInfo } from '../components/BusinessInfo.js';
import { HeaderInfo } from '../components/HeaderInfo.js';
import { LogoInfo } from '../components/LogoInfo.js';
import { NotesInfo } from '../components/NotesInfo.js';
import { PageCounterInfo } from '../components/PageCounterInfo.js';
import { QRCodeInfo } from '../components/QRCodeInfo.js';
import { SignatureInfo } from '../components/SignatureInfo.js';
import { WatermarkInfo } from '../components/WatermarkInfo.js';
import { WatermarkPaidInfo } from '../components/WatermarkPaidInfo.js';

vi.mock('@react-pdf/renderer', () => ({
  Image: ({ src }: { src: string }) => <img src={src} />,
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
  Text: ({
    children,
    render
  }: {
    children?: ReactNode;
    render?: (context: { pageNumber: number; totalPages: number }) => ReactNode;
  }) => <span>{render ? render({ pageNumber: 2, totalPages: 3 }) : children}</span>,
  View: ({ children }: { children?: ReactNode }) => <div>{children}</div>
}));

const pdfTexts = {
  billTo: 'Bill to',
  invoiceNo: 'Invoice no.',
  quoteNo: 'Quote no.',
  date: 'Date',
  dueDate: 'Due date',
  customerNote: 'Customer note',
  termsConditions: 'Terms',
  of: 'of',
  page: 'Page',
  paymentInfo: 'Payment information',
  pdfINVOICE: 'Invoice',
  pdfQUOTE: 'Quote',
  subTotalLabel: 'Subtotal',
  discountLabel: 'Discount',
  surchargeLabel: 'Surcharge',
  incLabel: 'incl.',
  taxLabel: 'Tax',
  taxExclusivePerItemLabel: 'Tax excl.',
  taxInclusivePerItemLabel: 'Tax incl.',
  shippingFeeLabel: 'Shipping',
  totalLabel: 'Total',
  paidLabel: 'Paid',
  balanceDueLabel: 'Balance due',
  itemLabel: 'Item',
  unitLabel: 'Unit',
  qtyLabel: 'Quantity',
  unitCostLabel: 'Unit cost',
  authorisedSignatoryLabel: 'Authorised by'
} satisfies PdfTexts;

const emptyInvoice = {} as InvoiceAdd;
const fieldSortOrders = { no: 0, item: 1, unit: 2, quantity: 3, unitCost: 4, total: 5 };
const customization = (overrides: Partial<InvoiceCustomization> = {}): InvoiceCustomization => ({
  fieldSortOrders,
  ...overrides
});

afterEach(cleanup);

describe('optional PDF components', () => {
  it('renders optional image elements only when their source and invoice data exist', () => {
    const { container, rerender } = render(
      <LogoInfo invoiceForm={emptyInvoice} logoUrl="data:image/png;base64,logo" />
    );
    expect(container.querySelector('img')).not.toBeInTheDocument();

    rerender(
      <LogoInfo
        invoiceForm={
          {
            invoiceBusinessSnapshot: {
              businessName: 'Ada Consulting',
              businessShortName: 'Ada',
              businessLogo: new Uint8Array([1])
            },
            invoiceCustomization: customization({ logoSize: SizeType.small })
          } as InvoiceAdd
        }
        logoUrl="data:image/png;base64,logo"
      />
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,logo');

    rerender(
      <QRCodeInfo
        invoiceForm={{ invoiceBankSnapshot: { qrCode: new Uint8Array([1]) } } as InvoiceAdd}
        qrCodeUrl="data:image/png;base64,qr"
      />
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,qr');

    rerender(
      <SignatureInfo
        invoiceForm={{ signatureData: new Uint8Array([1]) } as InvoiceAdd}
        signatureUrl="data:image/png;base64,signature"
        authorisedSignatoryLabel="Authorised by"
      />
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,signature');

    rerender(
      <WatermarkInfo
        invoiceForm={
          {
            invoiceCustomization: customization({ watermarkFileData: new Uint8Array([1]) })
          } as InvoiceAdd
        }
        watermarkUrl="data:image/png;base64,watermark"
      />
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,watermark');

    rerender(
      <WatermarkPaidInfo
        invoiceForm={
          {
            invoiceCustomization: customization({ paidWatermarkFileData: new Uint8Array([1]) })
          } as InvoiceAdd
        }
        watermarkPaidUrl="data:image/png;base64,paid"
      />
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,paid');
  });

  it('renders notes, business details, and the localized multi-page counter', () => {
    const { rerender } = render(
      <NotesInfo
        invoiceForm={
          {
            thanksNotes: 'Thank you',
            customerNotes: 'Customer note text',
            termsConditionNotes: 'Terms text'
          } as InvoiceAdd
        }
        labels={{ customerNoteLabel: 'Customer note', termsConditionsLabel: 'Terms' }}
      />
    );
    expect(screen.getByText('Thank you')).toBeInTheDocument();
    expect(screen.getByText('Customer note text')).toBeInTheDocument();
    expect(screen.getByText('Terms text')).toBeInTheDocument();

    rerender(
      <BusinessInfo
        textAlign="center"
        invoiceForm={
          {
            invoiceCustomization: { fontSize: 'small' },
            invoiceBusinessSnapshot: {
              businessName: 'Ada Consulting',
              businessRole: 'Consultant',
              businessAddress: '1 Analytical Engine Way',
              businessEmail: 'ada@example.test',
              businessPhone: '+44 20 0000 0000',
              businessCode: 'AC-1',
              businessVatCode: 'GB123',
              businessAdditional: 'Registered office'
            }
          } as InvoiceAdd
        }
      />
    );
    for (const text of [
      'Ada Consulting',
      'Consultant',
      '1 Analytical Engine Way',
      'ada@example.test',
      '+44 20 0000 0000',
      'AC-1',
      'GB123',
      'Registered office'
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }

    rerender(<PageCounterInfo labels={{ pageLabel: 'Page', ofLabel: 'of' }} />);
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('renders supported header blocks and skips absent optional values', () => {
    const { container } = render(
      <HeaderInfo
        invoiceForm={
          {
            invoiceType: 'invoice',
            status: InvoiceStatus.paid,
            invoiceBusinessSnapshot: {
              businessName: 'Ada Consulting',
              businessShortName: 'Ada',
              businessLogo: new Uint8Array([1])
            },
            invoiceClientSnapshot: { clientName: 'Grace Hopper' },
            invoiceCustomization: customization({ logoSize: SizeType.medium })
          } as InvoiceAdd
        }
        logoUrl="data:image/png;base64,logo"
        pdfTexts={pdfTexts}
        blocks={[
          {
            type: 'row',
            align: 'center',
            justify: 'between',
            width: '100%',
            paddingTop: 10,
            paddingBottom: 20,
            gap: 5,
            boxed: true,
            children: [
              { type: 'title' },
              { type: 'logo' },
              { type: 'businessInfo' },
              { type: 'clientInfo' },
              { type: 'invoiceMeta', showTitle: true, showInvoiceLabel: true },
              { type: 'paymentInfo', paymentSource: 'bank' }
            ]
          },
          {
            type: 'column',
            align: 'end',
            width: '60%',
            paddingTop: 20,
            gap: 10,
            children: [{ type: 'businessInfo', textAlign: 'right' }]
          }
        ]}
      />
    );

    expect(screen.getAllByText('Ada Consulting')).toHaveLength(2);
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });
});
