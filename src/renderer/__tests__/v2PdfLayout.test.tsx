// @vitest-environment node
// jsdom's typed-array globals don't share a realm with Node's `fs`/Buffer, which
// intermittently breaks pdfkit's `instanceof Uint8Array` check when embedding real
// image files (see the "keeps fixed visual assets..." test). Run this file in the
// plain Node environment since it doesn't need DOM APIs.
import { pdf } from '@react-pdf/renderer';
import { resolve } from 'node:path';
import { PDFDocument as PdfLibDocument } from 'pdf-lib';
import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from '../pages/invoices/Preview/PDFDocument';
import { AmountFormat } from '../shared/enums/amountFormat';
import { DateFormat } from '../shared/enums/dateFormat';
import { FontFamily } from '../shared/enums/fontFamily';
import { InvoiceType } from '../shared/enums/invoiceType';
import { PageFormat } from '../shared/enums/pageFormat';
import { SizeType } from '../shared/enums/sizeType';
import type { InvoiceFromData, PdfTexts } from '../shared/types/invoice';
import { parseLayoutSchema, type LayoutSchemaAny, type LayoutSchemaV2 } from '../shared/types/layouts';
import type { Settings } from '../shared/types/settings';
import {
  addHeaderBlock,
  addLayoutSection,
  createLayoutBuilderState,
  serializeLayoutBuilderState
} from '../shared/utils/visualBuilderV1';
import {
  addLayoutBuilderV2Node,
  createLayoutBuilderV2State,
  serializeLayoutBuilderV2State
} from '../shared/utils/visualBuilderV2';

vi.mock('@react-pdf/renderer', async () => {
  const actual = await vi.importActual<typeof import('@react-pdf/renderer')>('@react-pdf/renderer');
  return {
    ...actual,
    Font: {
      register: vi.fn(config =>
        actual.Font.register({
          ...config,
          src: resolve(process.cwd(), 'src/renderer/assets/roboto/Roboto-Regular.ttf')
        })
      )
    }
  };
});

const pdfTexts: PdfTexts = {
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
};

const settings = {
  amountFormat: AmountFormat.enUS,
  dateFormat: DateFormat.MMddyyyy
} as Settings;

const items = Array.from({ length: 120 }, (_, index) => ({
  itemId: index + 1,
  quantity: '1',
  taxRate: 0,
  invoiceItemSnapshot: {
    parentInvoiceItemId: index + 1,
    itemName: `Long invoice item ${index + 1}`,
    unitPriceCents: '1000',
    unitName: 'each'
  }
}));

const invoice = (layoutSchema: LayoutSchemaAny): InvoiceFromData => ({
  invoiceType: InvoiceType.invoice,
  status: undefined,
  layoutId: 1,
  invoiceLayoutSnapshot: { layoutSchema },
  invoiceItems: items,
  invoiceCurrencySnapshot: { currencyCode: 'USD', currencySymbol: '$', currencySubunit: 2 },
  invoiceCustomization: {
    pageFormat: PageFormat.a4,
    fontFamily: FontFamily.roboto,
    fontSize: SizeType.small,
    showQuantity: true,
    showUnit: true,
    showRowNo: true,
    fieldSortOrders: { no: 1, item: 2, unit: 3, quantity: 4, unitCost: 5, total: 6 }
  }
});

const renderPdfBytes = async (layoutSchema: LayoutSchemaAny) => {
  const blob = await pdf(
    <PDFDocument
      invoiceForm={invoice(layoutSchema)}
      storeSettings={settings}
      attachmentUrls={[]}
      pdfTexts={pdfTexts}
      layoutRequired="Layout required"
    />
  ).toBlob();
  return new Uint8Array(await blob.arrayBuffer());
};

const renderPdf = async (layoutSchema: LayoutSchemaAny) => {
  return PdfLibDocument.load(await renderPdfBytes(layoutSchema));
};

const pageContent = (document: PdfLibDocument, pageIndex: number) => {
  const pageNode = (document.getPage(pageIndex) as unknown as { node: { Contents: () => unknown } }).node;
  const contents = pageNode.Contents();
  const streams =
    contents && typeof (contents as { asArray?: () => unknown[] }).asArray === 'function'
      ? (contents as { asArray: () => unknown[] }).asArray()
      : [contents];
  return streams
    .map(stream => {
      const resolved = document.context.lookup(stream as never) as unknown as { getContents?: () => Uint8Array };
      return resolved?.getContents ? new TextDecoder('latin1').decode(resolved.getContents()) : '';
    })
    .join('');
};

describe('V2 PDF layout rendering', () => {
  it('renders a schema produced by the visual builder', async () => {
    const initialLayout: LayoutSchemaV2 = {
      schemaVersion: 2,
      meta: { name: 'Builder parity' },
      regions: [{ id: 'main', width: '100%', direction: 'column', children: [] }]
    };
    const withRow = addLayoutBuilderV2Node(initialLayout, 'main', undefined, 'row');
    const rowId = createLayoutBuilderV2State(withRow).regions[0].children[0].id;
    const withLogo = addLayoutBuilderV2Node(withRow, 'main', rowId, 'logo');
    const builtLayout = addLayoutBuilderV2Node(withLogo, 'main', undefined, 'section', 'itemsTable');

    expect(parseLayoutSchema(JSON.stringify(builtLayout)).errors).toEqual([]);
    const document = await renderPdf(builtLayout);

    expect(document.getPageCount()).toBeGreaterThan(0);
    expect(pageContent(document, 0).length).toBeGreaterThan(0);
  });

  it('renders a V1 schema produced by the visual builder', async () => {
    const initialLayout = {
      schemaVersion: 1 as const,
      meta: { name: 'V1 builder parity' },
      sections: [
        { type: 'header' as const, visible: true },
        { type: 'itemsTable' as const, visible: true }
      ]
    };
    const withLogo = addHeaderBlock(initialLayout, 0, 'logo');
    const builtLayout = addLayoutSection(withLogo, 'financialTotals');
    const serializedLayout = serializeLayoutBuilderState(createLayoutBuilderState(builtLayout));

    expect(parseLayoutSchema(JSON.stringify(serializedLayout)).errors).toEqual([]);
    const document = await renderPdf(serializedLayout);

    expect(document.getPageCount()).toBeGreaterThan(0);
    expect(pageContent(document, 0).length).toBeGreaterThan(0);
  });

  it('rehydrates and reserializes persisted V1 builder JSON', () => {
    const layout = addHeaderBlock(
      {
        schemaVersion: 1 as const,
        meta: { name: 'Persisted V1 builder' },
        sections: [{ type: 'header' as const, visible: true }]
      },
      0,
      'businessInfo'
    );
    const serialized = serializeLayoutBuilderState(createLayoutBuilderState(layout));
    const parsed = parseLayoutSchema(JSON.stringify(serialized));

    expect(parsed.errors).toEqual([]);
    if (parsed.schema?.schemaVersion !== 1) throw new Error('Expected a V1 layout schema');
    const reserialized = serializeLayoutBuilderState(createLayoutBuilderState(parsed.schema));

    expect(reserialized).toEqual(serialized);
    expect(parseLayoutSchema(JSON.stringify(reserialized)).errors).toEqual([]);
  });

  it('rehydrates and reserializes persisted V2 builder JSON', () => {
    const layout: LayoutSchemaV2 = {
      schemaVersion: 2,
      meta: { name: 'Persisted V2 builder' },
      regions: [
        { id: 'main', width: '100%', direction: 'column', children: [{ type: 'block', block: { type: 'logo' } }] }
      ]
    };
    const serialized = serializeLayoutBuilderV2State(createLayoutBuilderV2State(layout));
    const parsed = parseLayoutSchema(JSON.stringify(serialized));

    expect(parsed.errors).toEqual([]);
    if (parsed.schema?.schemaVersion !== 2) throw new Error('Expected a V2 layout schema');
    const reserialized = serializeLayoutBuilderV2State(createLayoutBuilderV2State(parsed.schema));

    expect(reserialized).toEqual(serialized);
    expect(parseLayoutSchema(JSON.stringify(reserialized)).errors).toEqual([]);
  });

  it('flows a recursive items table across multiple pages', async () => {
    const layoutSchema: LayoutSchemaV2 = {
      schemaVersion: 2,
      meta: { name: 'Nested table' },
      regions: [
        {
          id: 'main',
          width: '100%',
          direction: 'column',
          overflow: 'continue',
          children: [
            {
              type: 'row',
              children: [{ type: 'section', section: { type: 'itemsTable', visible: true } }]
            },
            { type: 'section', section: { type: 'financialTotals', visible: true } }
          ]
        }
      ]
    };
    const snapshotBeforeRender = JSON.stringify(layoutSchema);
    const bytes = await renderPdfBytes(layoutSchema);
    const document = await PdfLibDocument.load(bytes);

    expect(document.getPageCount()).toBeGreaterThan(1);
    const contents = Array.from({ length: document.getPageCount() }, (_, index) => pageContent(document, index));
    expect(contents.every(content => content.length > 0)).toBe(true);
    expect(JSON.stringify(layoutSchema)).toBe(snapshotBeforeRender);
  });

  it('renders V2 landscape pages', async () => {
    const document = await renderPdf({
      schemaVersion: 2,
      meta: { name: 'Landscape sidebar' },
      orientation: 'landscape',
      regions: [
        {
          id: 'sidebar',
          width: '20%',
          direction: 'column',
          overflow: 'keepTogether',
          children: [{ type: 'block', block: { type: 'businessInfo' } }]
        },
        { id: 'main', width: '80%', direction: 'column', overflow: 'continue', sections: ['itemsTable'] }
      ]
    });

    const page = document.getPage(0);
    const { width, height } = page.getSize();
    expect(width).toBeGreaterThan(height);
  });

  it('keeps fixed visual assets and page counters on a multi-page document', async () => {
    const imageSource = resolve(process.cwd(), 'src/renderer/assets/icon.png');
    // Use a larger item set than the shared `items` fixture so the resulting page count
    // clears the 2-page threshold with a wide margin, avoiding cross-platform font
    // metric rounding differences flipping the count right at the boundary.
    const manyItems = Array.from({ length: 320 }, (_, index) => ({
      itemId: index + 1,
      quantity: '1',
      taxRate: 0,
      invoiceItemSnapshot: {
        parentInvoiceItemId: index + 1,
        itemName: `Long invoice item ${index + 1}`,
        unitPriceCents: '1000',
        unitName: 'each'
      }
    }));
    const blob = await pdf(
      <PDFDocument
        invoiceForm={{
          ...invoice({
            schemaVersion: 2,
            meta: { name: 'Assets' },
            regions: [
              {
                id: 'main',
                width: '100%',
                direction: 'column',
                children: [
                  { type: 'section', section: { type: 'watermark', visible: true } },
                  { type: 'section', section: { type: 'itemsTable', visible: true } },
                  { type: 'section', section: { type: 'signature', visible: true } },
                  { type: 'section', section: { type: 'pageCounter', visible: true } }
                ]
              }
            ]
          }),
          invoiceItems: manyItems,
          signatureData: new Uint8Array([1]),
          invoiceCustomization: {
            ...invoice({ schemaVersion: 2, meta: { name: 'Assets' }, regions: [] }).invoiceCustomization,
            fieldSortOrders: { no: 1, item: 2, unit: 3, quantity: 4, unitCost: 5, total: 6 },
            watermarkFileData: new Uint8Array([1])
          }
        }}
        storeSettings={settings}
        attachmentUrls={[{ id: 1, url: imageSource }]}
        pdfTexts={pdfTexts}
        layoutRequired="Layout required"
        watermarkUrl={imageSource}
        signatureUrl={imageSource}
      />
    ).toBlob();
    const document = await PdfLibDocument.load(await blob.arrayBuffer());
    const contents = Array.from({ length: document.getPageCount() }, (_, index) => pageContent(document, index));

    expect(document.getPageCount()).toBeGreaterThan(2);
    expect(contents.every(content => content.length > 0)).toBe(true);
  });
});
