import { DiscountType } from '../shared/enums/discountType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../shared/enums/taxType';
import type { Invoice, InvoiceItem, InvoicePayment } from '../shared/types/invoice';
import {
  aggregateVat,
  calculateDiscount,
  calculateInvoiceLine,
  calculateInvoiceTotals,
  calculateSurcharge,
  getInvoiceItemAmount,
  getTotalAmountPaidCents,
  getTotalUnitPrice
} from '../shared/utils/einvoice/invoiceFunctions';

const item = (overrides: Partial<InvoiceItem> = {}): InvoiceItem =>
  ({
    itemId: 1,
    quantity: '2',
    taxRate: 10,
    taxType: InvoiceItemTaxType.exclusive,
    invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Item', unitPriceCents: '1000', unitName: 'each' },
    ...overrides
  }) as InvoiceItem;

describe('getTotalAmountPaidCents', () => {
  it('sums payment amounts', () => {
    expect(getTotalAmountPaidCents([{ amountCents: '100' }, { amountCents: '200' }] as InvoicePayment[])).toBe(300);
  });

  it('returns 0 for empty or missing payments', () => {
    expect(getTotalAmountPaidCents([])).toBe(0);
    expect(getTotalAmountPaidCents(undefined as never)).toBe(0);
  });
});

describe('getTotalUnitPrice/getInvoiceItemAmount', () => {
  it('multiplies unit price by quantity', () => {
    expect(getTotalUnitPrice({ unitPrice: 100, quantity: '3' })).toBe(300);
  });

  it('derives the amount from an invoice item snapshot', () => {
    expect(getInvoiceItemAmount(item())).toBe(2000);
  });
});

describe('calculateSurcharge', () => {
  it('returns 0 without a surcharge type', () => {
    expect(calculateSurcharge(1000, {} as Invoice)).toBe(0);
  });

  it('applies a fixed surcharge', () => {
    expect(calculateSurcharge(1000, { surchargeType: DiscountType.fixed, surchargeAmountCents: '50' } as Invoice)).toBe(
      50
    );
  });

  it('applies a percentage surcharge', () => {
    expect(calculateSurcharge(1000, { surchargeType: DiscountType.percentage, surchargePercent: 10 } as Invoice)).toBe(
      100
    );
  });
});

describe('calculateDiscount', () => {
  it('returns 0 without a discount type', () => {
    expect(calculateDiscount(1000, {} as Invoice)).toBe(0);
  });

  it('applies a fixed discount', () => {
    expect(calculateDiscount(1000, { discountType: DiscountType.fixed, discountAmountCents: '50' } as Invoice)).toBe(
      50
    );
  });

  it('applies a percentage discount', () => {
    expect(calculateDiscount(1000, { discountType: DiscountType.percentage, discountPercent: 10 } as Invoice)).toBe(
      100
    );
  });
});

describe('aggregateVat', () => {
  it('groups lines by tax rate', () => {
    const result = aggregateVat([
      { lineAmount: 100, taxAmount: 10, taxRate: 10 } as never,
      { lineAmount: 200, taxAmount: 20, taxRate: 10 } as never,
      { lineAmount: 50, taxAmount: 0, taxRate: 0 } as never
    ]);
    expect(result).toEqual([
      { rate: 10, taxable: 300, tax: 30 },
      { rate: 0, taxable: 50, tax: 0 }
    ]);
  });
});

describe('calculateInvoiceLine', () => {
  it('computes exclusive tax with a discount portion', () => {
    const result = calculateInvoiceLine(item(), 200, 2000, 0, InvoiceTaxType.exclusive);
    expect(result.grossAmount).toBe(2000);
    expect(result.discountAmount).toBe(200);
    expect(result.lineAmount).toBe(1800);
    expect(result.taxAmount).toBeCloseTo(180);
    expect(result.taxCategoryId).toBe('S');
  });

  it('computes inclusive tax', () => {
    const result = calculateInvoiceLine(
      item({ taxType: InvoiceItemTaxType.inclusive }),
      0,
      2000,
      0,
      InvoiceTaxType.inclusive
    );
    expect(result.lineAmount).toBeCloseTo(2000 / 1.1);
  });

  it('computes deducted tax as negative when invoice-level type is deducted', () => {
    const result = calculateInvoiceLine(item({ taxType: undefined }), 0, 2000, 10, InvoiceTaxType.deducted);
    expect(result.taxAmount).toBeLessThan(0);
  });

  it('defaults to zero tax and category Z when there is no tax type', () => {
    const result = calculateInvoiceLine(item({ taxType: undefined, taxRate: 0 }), 0, 2000, 0, undefined);
    expect(result.taxAmount).toBe(0);
    expect(result.taxCategoryId).toBe('Z');
  });

  it('falls back to the invoice tax rate when the item has no tax type', () => {
    const result = calculateInvoiceLine(item({ taxType: undefined }), 0, 2000, 15, InvoiceTaxType.exclusive);
    expect(result.taxRate).toBe(15);
  });
});

describe('calculateInvoiceTotals', () => {
  it('aggregates line items into invoice-level totals', () => {
    const invoice = {
      invoiceItems: [item(), item({ itemId: 2 })],
      taxRate: 0,
      shippingFeeCents: '100',
      discountType: DiscountType.fixed,
      discountAmountCents: '400',
      surchargeType: DiscountType.fixed,
      surchargeAmountCents: '50'
    } as Invoice;

    const result = calculateInvoiceTotals(invoice);
    expect(result.lines).toHaveLength(2);
    expect(result.shippingTotal).toBe(100);
    expect(result.discountTotal).toBe(400);
    expect(result.surchargeTotal).toBe(50);
    expect(result.payableTotal).toBeGreaterThan(0);
    expect(result.vatGroups.length).toBeGreaterThan(0);
  });
});
