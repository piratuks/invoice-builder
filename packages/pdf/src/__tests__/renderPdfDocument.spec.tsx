import { createElement, type ComponentProps, type FC, type ReactElement } from 'react';
import { AmountFormat, DateFormat } from '@invoice-builder/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvoicePdfDocument } from '../components/document.js';
import type { PDFDocument } from '../components/PDFDocument.js';
import type { InvoicePdfInput } from '../types.js';
import { renderPdfDocument } from '../runtime/renderPdfDocument.js';

const { pdfMock } = vi.hoisted(() => ({
  pdfMock: vi.fn()
}));

vi.mock('@react-pdf/renderer', () => ({ pdf: pdfMock }));

type TestPdfProps = Partial<ComponentProps<typeof InvoicePdfDocument>> & Partial<ComponentProps<typeof PDFDocument>>;

const TestPdfDocument: FC<TestPdfProps> = () => null;
const blob = new Blob(['pdf'], { type: 'application/pdf' });

const makeInvoiceForm = (showItemDescriptions: boolean, itemDescription?: string): InvoicePdfInput['invoiceForm'] => ({
  invoiceCustomization: {
    showItemDescriptions,
    fieldSortOrders: { no: 0, item: 1, unit: 2, quantity: 3, unitCost: 4, total: 5 }
  },
  invoiceItems: itemDescription
    ? [
        {
          itemId: 1,
          quantity: '1',
          taxRate: 0,
          invoiceItemSnapshot: {
            parentInvoiceItemId: 1,
            itemName: 'Item',
            itemDescription,
            unitPriceCents: '100'
          }
        }
      ]
    : []
});

const makeInput = (overrides: Partial<InvoicePdfInput> = {}): InvoicePdfInput => ({
  invoiceForm: makeInvoiceForm(false),
  storeSettings: {
    amountFormat: AmountFormat.enUS,
    dateFormat: DateFormat.MMddyyyy
  },
  attachmentUrls: [],
  pdfTexts: {} as InvoicePdfInput['pdfTexts'],
  layoutRequired: 'Layout required',
  ...overrides
});

const makeDocument = (input: InvoicePdfInput): ReactElement<TestPdfProps> => createElement(TestPdfDocument, { input });

const makeLayoutRenderer = (layout: unknown) => {
  let document: ReactElement<TestPdfProps> | undefined;
  const renderer = {
    toBlob: vi.fn(async () => {
      document?.props.onRender?.({ _INTERNAL__LAYOUT__DATA_: layout } as never);
      return blob;
    }),
    updateContainer: vi.fn((nextDocument: ReactElement<TestPdfProps>, callback: () => void) => {
      document = nextDocument;
      callback();
    })
  };
  pdfMock.mockImplementation((nextDocument: ReactElement<TestPdfProps>) => {
    document = nextDocument;
    return renderer;
  });
  return renderer;
};

describe('renderPdfDocument', () => {
  beforeEach(() => {
    pdfMock.mockReset();
  });

  it('rejects incomplete prepared PDF input', async () => {
    const invalidInput = {
      ...makeInput(),
      pdfTexts: { subtotal: 5 }
    } as unknown as InvoicePdfInput;

    await expect(renderPdfDocument(makeDocument(invalidInput))).rejects.toThrow(
      'PDF input is missing required invoice, settings, labels, or attachment data.'
    );
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it('rejects attachments without inline data URLs', async () => {
    const input = makeInput({ attachmentUrls: [{ id: 12, url: '' }] });

    await expect(renderPdfDocument(makeDocument(input))).rejects.toThrow(
      'Missing inline data URL for invoice attachment 12.'
    );
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it('rejects image assets that are not inline data URLs', async () => {
    const input = makeInput({ logoUrl: 'https://example.test/logo.png' });

    await expect(renderPdfDocument(makeDocument(input))).rejects.toThrow(
      'PDF image assets must be non-empty inline data URLs.'
    );
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it('returns the standard PDF render when item descriptions are not visible', async () => {
    const renderer = makeLayoutRenderer(undefined);

    await expect(renderPdfDocument(makeDocument(makeInput()))).resolves.toBe(blob);

    expect(renderer.toBlob).toHaveBeenCalledTimes(1);
    expect(renderer.updateContainer).not.toHaveBeenCalled();
  });

  it('reports a missing renderer layout when item rows need measurement', async () => {
    const input = makeInput({ invoiceForm: makeInvoiceForm(true, 'Description') });
    makeLayoutRenderer(undefined);

    await expect(renderPdfDocument(makeDocument(input))).rejects.toThrow(
      'The PDF renderer did not provide layout measurements.'
    );
  });

  it('marks oversized description rows splittable and reuses the renderer', async () => {
    const input = makeInput({ invoiceForm: makeInvoiceForm(true, 'Description') });
    const renderer = makeLayoutRenderer({
      children: [
        {
          type: 'PAGE',
          style: { height: 100 },
          box: { paddingTop: 10, paddingBottom: 10 },
          children: [
            {
              props: { id: 'invoice-description-row-1' },
              box: { height: 81 }
            }
          ]
        }
      ]
    });

    await expect(renderPdfDocument(makeDocument(input))).resolves.toBe(blob);

    expect(renderer.toBlob).toHaveBeenCalledTimes(2);
    expect(renderer.updateContainer).toHaveBeenCalledOnce();
    expect(renderer.updateContainer.mock.calls[0][0].props.splittableItemRowIds).toEqual(
      new Set(['invoice-description-row-1'])
    );
  });

  it.each([
    ['no pages', {}, 'Unable to measure PDF pages.'],
    [
      'invalid page height',
      { children: [{ type: 'PAGE', style: { height: Number.NaN } }] },
      'Unable to measure PDF page height.'
    ],
    [
      'no available content height',
      { children: [{ type: 'PAGE', style: { height: 20 }, box: { paddingTop: 10, paddingBottom: 10 } }] },
      'The PDF page has no space for content.'
    ],
    [
      'missing row height',
      {
        children: [
          {
            type: 'PAGE',
            style: { height: 100 },
            children: [{ props: { id: 'invoice-description-row-1' } }]
          }
        ]
      },
      'Unable to measure an invoice item row.'
    ],
    [
      'oversized row inside a non-wrapping parent',
      {
        children: [
          {
            type: 'PAGE',
            style: { height: 100 },
            children: [
              {
                props: { wrap: false },
                children: [
                  {
                    props: { id: 'invoice-description-row-1' },
                    box: { height: 101 }
                  }
                ]
              }
            ]
          }
        ]
      },
      'This layout keeps the item table together. Use a layout that allows the table to continue across pages.'
    ]
  ])('reports invalid layout measurements: %s', async (_case, layout, message) => {
    const input = makeInput({ invoiceForm: makeInvoiceForm(true, 'Description') });
    makeLayoutRenderer(layout);

    await expect(renderPdfDocument(makeDocument(input))).rejects.toThrow(message);
  });
});
