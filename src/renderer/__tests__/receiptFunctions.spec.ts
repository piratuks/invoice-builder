import { AmountFormat } from '../shared/enums/amountFormat';
import { DateFormat } from '../shared/enums/dateFormat';
import { DiscountType } from '../shared/enums/discountType';
import { InvoiceStatus } from '../shared/enums/invoiceStatus';
import { InvoiceType } from '../shared/enums/invoiceType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../shared/enums/taxType';
import type { InvoiceFromData } from '../shared/types/invoice';
import type { Settings } from '../shared/types/settings';
import { buildReceiptHtml, type ReceiptTexts } from '../shared/utils/receiptFunctions';

const texts: ReceiptTexts = {
  invoiceLabel: 'Invoice',
  quoteLabel: 'Quote',
  issuedAtLabel: 'Issued at',
  billToLabel: 'Bill to',
  itemLabel: 'Item',
  qtyLabel: 'Qty',
  unitCostLabel: 'Unit cost',
  subTotalLabel: 'Subtotal',
  discountLabel: 'Discount',
  surchargeLabel: 'Surcharge',
  incLabel: 'incl.',
  taxLabel: 'Tax',
  taxExclusivePerItemLabel: 'Tax excl. per item',
  taxInclusivePerItemLabel: 'Tax incl. per item',
  shippingFeeLabel: 'Shipping',
  totalLabel: 'Total',
  paidLabel: 'Paid',
  balanceDueLabel: 'Balance due'
};

const storeSettings = { amountFormat: AmountFormat.enUS, dateFormat: DateFormat.MMddyyyy } as Settings;

const baseInvoice = (overrides: Partial<InvoiceFromData> = {}): InvoiceFromData =>
  ({
    invoiceType: InvoiceType.invoice,
    status: InvoiceStatus.unpaid,
    invoiceNumber: '001',
    issuedAt: '2024-01-15',
    invoiceCurrencySnapshot: { currencyCode: 'USD', currencySymbol: '$', currencySubunit: 100 },
    invoiceBusinessSnapshot: { businessName: 'Acme & Co', businessAddress: '1 <Main> St' },
    invoiceClientSnapshot: { clientName: 'Client "A"' },
    invoiceItems: [
      {
        itemId: 1,
        quantity: '2',
        taxRate: 10,
        taxType: InvoiceItemTaxType.exclusive,
        invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Widget', unitPriceCents: '1000', unitName: 'each' }
      }
    ],
    invoicePayments: [],
    taxRate: 0,
    discountAmountCents: '0',
    surchargeAmountCents: '0',
    shippingFeeCents: '0',
    ...overrides
  }) as InvoiceFromData;

describe('buildReceiptHtml', () => {
  it('escapes special characters and includes business/client info', () => {
    const html = buildReceiptHtml({ invoiceForm: baseInvoice(), storeSettings, texts });
    expect(html).toContain('Acme &amp; Co');
    expect(html).toContain('1 &lt;Main&gt; St');
    expect(html).toContain('Client &quot;A&quot;');
    expect(html).toContain('Widget');
  });

  it('renders a quotation label for quotations', () => {
    const html = buildReceiptHtml({
      invoiceForm: baseInvoice({ invoiceType: InvoiceType.quotation }),
      storeSettings,
      texts
    });
    expect(html).toContain('Quote #001');
  });

  it('shows discount, shipping and surcharge rows when present', () => {
    const html = buildReceiptHtml({
      invoiceForm: baseInvoice({
        discountType: DiscountType.percentage,
        discountPercent: 10,
        discountAmountCents: '0',
        shippingFeeCents: '500',
        surchargeType: DiscountType.fixed,
        surchargeAmountCents: '200'
      }),
      storeSettings,
      texts
    });
    expect(html).toContain('Discount (10%)');
    expect(html).toContain('Shipping');
    expect(html).toContain('Surcharge');
  });

  it('shows an invoice-level exclusive tax row with a custom tax name', () => {
    const html = buildReceiptHtml({
      invoiceForm: baseInvoice({ taxType: InvoiceTaxType.exclusive, taxRate: 10, taxName: 'VAT' }),
      storeSettings,
      texts
    });
    expect(html).toContain('VAT (10%)');
  });

  it('shows an inclusive tax row', () => {
    const html = buildReceiptHtml({
      invoiceForm: baseInvoice({ taxType: InvoiceTaxType.inclusive, taxRate: 10 }),
      storeSettings,
      texts
    });
    expect(html).toContain('incl.');
  });

  it('falls back to per-item tax labels when there is no invoice-level tax', () => {
    const html = buildReceiptHtml({ invoiceForm: baseInvoice(), storeSettings, texts });
    expect(html).toContain(texts.taxExclusivePerItemLabel);
  });

  it('shows paid and balance due rows for an unpaid invoice with payments', () => {
    const html = buildReceiptHtml({
      invoiceForm: baseInvoice({ invoicePayments: [{ amountCents: '500' } as never] }),
      storeSettings,
      texts
    });
    expect(html).toContain(texts.paidLabel);
    expect(html).toContain(texts.balanceDueLabel);
  });

  it('hides paid/balance rows for a paid invoice', () => {
    const html = buildReceiptHtml({
      invoiceForm: baseInvoice({ status: InvoiceStatus.paid, invoicePayments: [{ amountCents: '500' } as never] }),
      storeSettings,
      texts
    });
    expect(html).not.toContain(texts.balanceDueLabel);
    expect(html).not.toContain(texts.paidLabel);
  });

  it('adjusts print margins for web mode', () => {
    const webHtml = buildReceiptHtml({ invoiceForm: baseInvoice(), storeSettings, texts, isWeb: true });
    const nativeHtml = buildReceiptHtml({ invoiceForm: baseInvoice(), storeSettings, texts, isWeb: false });
    expect(webHtml).toContain('15mm 4mm');
    expect(nativeHtml).toContain('margin: 4mm;');
  });
});
