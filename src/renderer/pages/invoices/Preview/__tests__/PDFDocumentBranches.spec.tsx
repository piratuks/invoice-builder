import { render, screen, within } from '@testing-library/react';
import type { ImgHTMLAttributes, ReactNode } from 'react';
import { InvoiceStatus } from '../../../../shared/enums/invoiceStatus';
import type { InvoiceFromData, PdfTexts } from '../../../../shared/types/invoice';
import type { LayoutSchema, LayoutSchemaV2 } from '../../../../shared/types/layouts';
import { PDFDocument } from '../PDFDocument';

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children?: ReactNode }) => <main data-testid="document">{children}</main>,
  Font: { register: vi.fn() },
  Image: ({ src }: ImgHTMLAttributes<HTMLImageElement>) => <img alt="attachment" src={src} />,
  Page: ({ children }: { children?: ReactNode }) => <section data-testid="page">{children}</section>,
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  View: ({ children }: { children?: ReactNode }) => <div>{children}</div>
}));

vi.mock('../FinancialInfo', () => ({
  FinancialInfo: ({ align }: { align?: string }) => <div data-testid="financial-info" data-align={align ?? 'end'} />
}));
vi.mock('../HeaderInfo', () => ({
  HeaderInfo: ({ blocks = [] }: { blocks?: Array<{ type: string }> }) => (
    <div data-testid="header-info">{blocks.map(block => block.type).join(',')}</div>
  )
}));
vi.mock('../ItemsInfo', () => ({
  ItemsInfo: ({ columnSizing }: { columnSizing?: string }) => (
    <div data-testid="items-info" data-sizing={columnSizing ?? 'fixedFlex'} />
  )
}));
vi.mock('../NotesInfo', () => ({ NotesInfo: () => <div data-testid="notes-info" /> }));
vi.mock('../PageCounterInfo', () => ({ PageCounterInfo: () => <div data-testid="page-counter" /> }));
vi.mock('../PaymentInfo', () => ({
  PaymentInfo: ({ source }: { source?: string }) => <div data-testid="payment-info" data-source={source ?? 'bank'} />
}));
vi.mock('../SignatureInfo', () => ({ SignatureInfo: () => <div data-testid="signature-info" /> }));
vi.mock('../WatermarkInfo', () => ({ WatermarkInfo: () => <div data-testid="watermark" /> }));
vi.mock('../WatermarkPaidInfo', () => ({ WatermarkPaidInfo: () => <div data-testid="paid-watermark" /> }));

const pdfTexts = {
  itemLabel: 'Item',
  unitLabel: 'Unit',
  qtyLabel: 'Quantity',
  unitCostLabel: 'Unit cost',
  totalLabel: 'Total',
  taxLabel: 'Tax',
  discountLabel: 'Discount',
  subTotalLabel: 'Subtotal',
  surchargeLabel: 'Surcharge',
  incLabel: 'incl.',
  taxExclusivePerItemLabel: 'Tax excl.',
  taxInclusivePerItemLabel: 'Tax incl.',
  shippingFeeLabel: 'Shipping',
  paidLabel: 'Paid',
  balanceDueLabel: 'Balance due',
  paymentInfo: 'Payment',
  customerNote: 'Note',
  termsConditions: 'Terms',
  authorisedSignatoryLabel: 'Authorised by',
  of: 'of',
  page: 'Page'
} as PdfTexts;

const renderDocument = (invoiceForm?: InvoiceFromData, attachmentUrls: Array<{ id: number; url: string }> = []) =>
  render(
    <PDFDocument
      invoiceForm={invoiceForm}
      attachmentUrls={attachmentUrls}
      pdfTexts={pdfTexts}
      layoutRequired="Choose a layout"
    />
  );

describe('PDFDocument layout branches', () => {
  it('shows the missing-layout message and renders attachment pages', () => {
    renderDocument({} as InvoiceFromData, [{ id: 7, url: 'attachment-7.png' }]);

    expect(screen.getByText('Choose a layout')).toBeInTheDocument();
    expect(screen.getAllByTestId('page')).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'attachment' })).toHaveAttribute('src', 'attachment-7.png');
    expect(screen.getByTestId('watermark')).toBeInTheDocument();
    expect(screen.getByTestId('page-counter')).toBeInTheDocument();
  });

  it('dispatches visible V1 sections, totals blocks, alignment, and paid-first watermarks', () => {
    const layoutSchema: LayoutSchema = {
      schemaVersion: 1,
      meta: { name: 'All sections' },
      sections: [
        { type: 'watermark', visible: true, watermarkOrder: 'paidFirst' },
        { type: 'header', visible: true, blocks: [{ type: 'logo' }] },
        { type: 'itemsTable', visible: true, columnSizing: 'proportional' },
        { type: 'financialTotals', visible: true, align: 'start' },
        { type: 'paymentInfo', visible: true },
        {
          type: 'totalsRow',
          visible: true,
          totalsBlocks: [
            { type: 'spacer' },
            { type: 'paymentInfo', paymentSource: 'legacyBusiness' },
            { type: 'financialTotals' }
          ]
        },
        { type: 'notes', visible: true },
        { type: 'signature', visible: true },
        { type: 'pageCounter', visible: true },
        { type: 'header', visible: false, blocks: [{ type: 'clientInfo' }] }
      ]
    };
    renderDocument({
      layoutId: 1,
      status: InvoiceStatus.paid,
      invoiceLayoutSnapshot: { layoutSchema }
    } as InvoiceFromData);

    expect(screen.getByTestId('header-info')).toHaveTextContent('logo');
    expect(screen.getByTestId('items-info')).toHaveAttribute('data-sizing', 'proportional');
    expect(screen.getAllByTestId('financial-info').map(node => node.dataset.align)).toEqual(['start', 'end']);
    expect(screen.getAllByTestId('payment-info').map(node => node.dataset.source)).toEqual(['bank', 'legacyBusiness']);
    expect(screen.getByTestId('notes-info')).toBeInTheDocument();
    expect(screen.getByTestId('signature-info')).toBeInTheDocument();
    expect(screen.getByTestId('page-counter')).toBeInTheDocument();

    const page = screen.getByTestId('page');
    const watermarkElements = within(page).getAllByTestId(/^(paid-)?watermark$/);
    expect(watermarkElements.map(element => element.dataset.testid)).toEqual(['paid-watermark', 'watermark']);
    expect(screen.queryByText('clientInfo')).not.toBeInTheDocument();
  });

  it('renders V2 region shortcuts and recursively handles block, section, row, column, and grid nodes', () => {
    const layoutSchema: LayoutSchemaV2 = {
      schemaVersion: 2,
      meta: { name: 'Recursive layout' },
      orientation: 'landscape',
      regions: [
        {
          id: 'sidebar',
          width: '30%',
          direction: 'column',
          overflow: 'keepTogether',
          gap: 10,
          blocks: [{ type: 'businessInfo' }],
          sections: ['notes'],
          children: [
            { type: 'block', block: { type: 'clientInfo' } },
            { type: 'section', section: { type: 'signature', visible: false } },
            {
              type: 'column',
              width: '100%',
              children: [
                {
                  type: 'row',
                  children: [{ type: 'section', section: { type: 'financialTotals', visible: true, align: 'center' } }]
                }
              ]
            }
          ]
        },
        {
          id: 'main',
          width: '70%',
          direction: 'grid',
          overflow: 'continue',
          children: [
            {
              type: 'grid',
              gap: 5,
              children: [{ type: 'section', section: { type: 'itemsTable', visible: true } }]
            }
          ]
        }
      ]
    };
    renderDocument({ layoutId: 2, invoiceLayoutSnapshot: { layoutSchema } } as InvoiceFromData);

    expect(screen.getAllByTestId('header-info').map(node => node.textContent)).toEqual(['businessInfo', 'clientInfo']);
    expect(screen.getByTestId('notes-info')).toBeInTheDocument();
    expect(screen.getByTestId('financial-info')).toHaveAttribute('data-align', 'center');
    expect(screen.getByTestId('items-info')).toBeInTheDocument();
    expect(screen.queryByTestId('signature-info')).not.toBeInTheDocument();
  });

  it('uses default watermark ordering and omits the paid watermark for unpaid invoices', () => {
    const layoutSchema: LayoutSchema = {
      schemaVersion: 1,
      meta: { name: 'Watermarks' },
      sections: [{ type: 'watermark', visible: true }]
    };
    const { rerender } = renderDocument({
      layoutId: 1,
      status: InvoiceStatus.paid,
      invoiceLayoutSnapshot: { layoutSchema }
    } as InvoiceFromData);

    expect(screen.getAllByTestId(/^(paid-)?watermark$/).map(element => element.dataset.testid)).toEqual([
      'watermark',
      'paid-watermark'
    ]);

    rerender(
      <PDFDocument
        invoiceForm={{ layoutId: 1, status: InvoiceStatus.open, invoiceLayoutSnapshot: { layoutSchema } }}
        attachmentUrls={[]}
        pdfTexts={pdfTexts}
        layoutRequired="Choose a layout"
      />
    );
    expect(screen.getByTestId('watermark')).toBeInTheDocument();
    expect(screen.queryByTestId('paid-watermark')).not.toBeInTheDocument();
  });
});
