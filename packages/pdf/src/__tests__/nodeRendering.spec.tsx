// @vitest-environment node
import { AmountFormat, DateFormat, InvoiceType } from '@invoice-builder/contracts';
import { describe, expect, it } from 'vitest';
import { renderInvoicePdf } from '../runtime/node.js';
import type { InvoicePdfInput } from '../types.js';

describe('Node PDF entry point', () => {
  it('registers packaged fonts and renders the shared document to PDF bytes', async () => {
    const input: InvoicePdfInput = {
      invoiceForm: {
        invoiceType: InvoiceType.invoice,
        invoiceLayoutSnapshot: {
          layoutSchema: {
            schemaVersion: 1,
            meta: { name: 'Node smoke test' },
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
