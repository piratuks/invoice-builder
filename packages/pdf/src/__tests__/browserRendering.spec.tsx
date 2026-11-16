import { AmountFormat, DateFormat, InvoiceType } from '@invoice-builder/contracts';
import { Font } from '@react-pdf/renderer';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderInvoicePdf } from '../runtime/browser.js';
import type { InvoicePdfInput } from '../types.js';

describe('browser PDF entry point', () => {
  it('renders the shared document to PDF bytes in the browser runtime', async () => {
    Font.register({
      family: 'Roboto',
      src: resolve(process.cwd(), 'packages/pdf/assets/roboto/Roboto-Regular.ttf'),
      fontWeight: 400
    });

    const input: InvoicePdfInput = {
      invoiceForm: {
        invoiceType: InvoiceType.invoice,
        invoiceLayoutSnapshot: {
          layoutSchema: {
            schemaVersion: 1,
            meta: { name: 'Browser smoke test' },
            sections: []
          }
        }
      },
      storeSettings: {
        amountFormat: AmountFormat.enUS,
        dateFormat: DateFormat.MMddyyyy
      },
      attachmentUrls: [],
      pdfTexts: {
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
      },
      layoutRequired: 'Layout required'
    };

    const bytes = await renderInvoicePdf(input);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});
