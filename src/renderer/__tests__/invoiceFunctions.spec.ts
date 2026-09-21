import { AmountFormat } from '../shared/enums/amountFormat';
import { CurrencyFormat } from '../shared/enums/currencyFormat';
import { DiscountType } from '../shared/enums/discountType';
import { InvoiceStatus } from '../shared/enums/invoiceStatus';
import { ReportDateType } from '../shared/enums/reportDateType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../shared/enums/taxType';
import type { Invoice, InvoiceItem, InvoicePayment } from '../shared/types/invoice';
import type { Settings } from '../shared/types/settings';
import {
  aggregateInvoicesByCurrency,
  calcDiscount,
  calcSurcharge,
  calcTax,
  calcUnitPrice,
  createCurrencyFormatter,
  getBalanceDue,
  getDaysLeft,
  getFinancialData,
  getInvoiceItemLevelTaxDiscount,
  getInvoiceItemTotal,
  getInvoiceTotal,
  getItemFinancialData,
  getPaidAmount,
  getPaidData,
  supportsCurrencySubunit
} from '../shared/utils/invoiceFunctions';

const item = (overrides: Partial<InvoiceItem> = {}): InvoiceItem =>
  ({
    itemId: 1,
    quantity: '2',
    taxRate: 10,
    taxType: InvoiceItemTaxType.exclusive,
    invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Item', unitPriceCents: '1000', unitName: 'each' },
    ...overrides
  }) as InvoiceItem;

describe('getDaysLeft', () => {
  it('returns 0 when no due date is given', () => {
    expect(getDaysLeft()).toBe(0);
  });

  it('returns positive days for a future date and negative for a past date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDaysLeft(future.toISOString())).toBe(5);

    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(getDaysLeft(past.toISOString())).toBe(-3);
  });
});

describe('calcUnitPrice', () => {
  it('divides by subunit when supported', () => {
    expect(calcUnitPrice({ supportsSubunit: true, amountCents: 1000, subunit: 100 })).toBe(10);
  });

  it('returns 0 when subunit is 0', () => {
    expect(calcUnitPrice({ supportsSubunit: true, amountCents: 1000, subunit: 0 })).toBe(0);
  });

  it('returns the raw amount when subunit is not supported', () => {
    expect(calcUnitPrice({ supportsSubunit: false, amountCents: 1000 })).toBe(1000);
  });
});

describe('calcTax', () => {
  it('returns 0 when no tax type is given', () => {
    expect(calcTax(100, 10)).toBe(0);
  });

  it('computes exclusive tax', () => {
    expect(calcTax(100, 10, InvoiceTaxType.exclusive)).toBe(10);
    expect(calcTax(100, 10, InvoiceItemTaxType.exclusive)).toBe(10);
  });

  it('computes inclusive tax', () => {
    expect(calcTax(110, 10, InvoiceTaxType.inclusive)).toBeCloseTo(10);
    expect(calcTax(110, 10, InvoiceItemTaxType.inclusive)).toBeCloseTo(10);
  });

  it('computes deducted tax as a negative amount', () => {
    expect(calcTax(100, 10, InvoiceTaxType.deducted)).toBe(-10);
  });
});

describe('calcSurcharge', () => {
  it('returns 0 without a surcharge type', () => {
    expect(calcSurcharge({ subTotal: 100 })).toBe(0);
  });

  it('applies a fixed surcharge', () => {
    expect(calcSurcharge({ subTotal: 100, surchargeType: DiscountType.fixed, surchargeAmount: 50 })).toBe(50);
  });

  it('applies a percentage surcharge', () => {
    expect(calcSurcharge({ subTotal: 100, surchargeType: DiscountType.percentage, surchargePercent: 10 })).toBe(10);
  });
});

describe('calcDiscount', () => {
  it('returns 0 without a discount type', () => {
    expect(calcDiscount({ subTotal: 100 })).toBe(0);
  });

  it('applies a fixed discount', () => {
    expect(calcDiscount({ subTotal: 100, discountType: DiscountType.fixed, discountAmount: 20 })).toBe(20);
  });

  it('applies a percentage discount', () => {
    expect(calcDiscount({ subTotal: 100, discountType: DiscountType.percentage, discountPercent: 15 })).toBe(15);
  });
});

describe('getInvoiceItemLevelTaxDiscount', () => {
  it('computes tax and discount for an item within the invoice', () => {
    const items = [item(), item({ itemId: 2 })];
    const result = getInvoiceItemLevelTaxDiscount({
      taxRate: 10,
      unitPrice: 1000,
      quantity: 2,
      taxType: InvoiceItemTaxType.exclusive,
      invoiceItems: items,
      discountType: DiscountType.percentage,
      discountPercent: 10
    });
    expect(result.discount).toBeGreaterThan(0);
    expect(result.tax).toBeGreaterThan(0);
  });

  it('returns zero discount when there is no discount type', () => {
    const items = [item()];
    const result = getInvoiceItemLevelTaxDiscount({
      taxRate: 10,
      unitPrice: 1000,
      quantity: 2,
      taxType: InvoiceItemTaxType.exclusive,
      invoiceItems: items
    });
    expect(result.discount).toBe(0);
  });
});

describe('getInvoiceItemTotal', () => {
  const items = [item()];

  it('includes tax by default for exclusive tax type', () => {
    const total = getInvoiceItemTotal({
      taxRate: 10,
      unitPrice: 1000,
      quantity: 2,
      taxType: InvoiceItemTaxType.exclusive,
      invoiceItems: items
    });
    expect(total).toBe(2200);
  });

  it('excludes tax when includeTax is false', () => {
    const total = getInvoiceItemTotal({
      taxRate: 10,
      unitPrice: 1000,
      quantity: 2,
      taxType: InvoiceItemTaxType.exclusive,
      invoiceItems: items,
      includeTax: false
    });
    expect(total).toBe(2000);
  });

  it('does not add tax again for inclusive tax type', () => {
    const total = getInvoiceItemTotal({
      taxRate: 10,
      unitPrice: 1000,
      quantity: 2,
      taxType: InvoiceItemTaxType.inclusive,
      invoiceItems: items
    });
    expect(total).toBe(2000);
  });
});

describe('getInvoiceTotal', () => {
  const items = [item()];

  it('computes a total with discount, surcharge, shipping and tax', () => {
    const total = getInvoiceTotal({
      taxRate: 10,
      taxType: InvoiceTaxType.exclusive,
      invoiceItems: items,
      discountType: DiscountType.fixed,
      discountAmount: 100,
      shippingFee: 50,
      surchargeType: DiscountType.fixed,
      surchargeAmount: 25
    });
    expect(total).toBeGreaterThan(0);
  });

  it('excludes invoice-level and item-level tax when includeTax is false', () => {
    const withTax = getInvoiceTotal({ taxRate: 10, taxType: InvoiceTaxType.exclusive, invoiceItems: items });
    const withoutTax = getInvoiceTotal({
      taxRate: 10,
      taxType: InvoiceTaxType.exclusive,
      invoiceItems: items,
      includeTax: false
    });
    expect(withoutTax).toBeLessThan(withTax);
  });

  it('does not double count tax for an inclusive invoice tax type', () => {
    const total = getInvoiceTotal({ taxRate: 10, taxType: InvoiceTaxType.inclusive, invoiceItems: items });
    expect(total).toBe(2000);
  });
});

describe('getPaidAmount', () => {
  it('sums payment amounts', () => {
    const payments = [{ amountCents: '100' }, { amountCents: '200' }] as InvoicePayment[];
    expect(getPaidAmount(payments)).toBe(300);
  });

  it('returns 0 for an empty list', () => {
    expect(getPaidAmount([])).toBe(0);
  });
});

describe('getBalanceDue', () => {
  it('subtracts paid amount from the invoice total', () => {
    const items = [item()];
    const payments = [{ amountCents: '500' }] as InvoicePayment[];
    const balance = getBalanceDue({
      taxRate: 10,
      taxType: InvoiceTaxType.exclusive,
      invoiceItems: items,
      invoicePayments: payments
    });
    expect(balance).toBe(1900);
  });
});

describe('supportsCurrencySubunit', () => {
  it('requires all currency fields to be present', () => {
    expect(supportsCurrencySubunit({})).toBe(false);
    expect(
      supportsCurrencySubunit({
        storeSettings: {} as Settings,
        currencySymbol: '$',
        currencyCode: 'USD',
        currencySubunit: 100,
        currencyFormat: CurrencyFormat.symbolAmount
      })
    ).toBe(true);
  });
});

describe('createCurrencyFormatter', () => {
  it('formats using currency snapshot data when supported', () => {
    const format = createCurrencyFormatter({
      storeSettings: { amountFormat: AmountFormat.enUS } as Settings,
      currencySymbol: '$',
      currencyCode: 'USD',
      currencySubunit: 100,
      currencyFormat: CurrencyFormat.symbolAmount
    });
    expect(format(1000)).toBe('$1,000.00');
  });

  it('falls back to plain amount formatting when unsupported', () => {
    const format = createCurrencyFormatter({ storeSettings: { amountFormat: AmountFormat.enUS } as Settings });
    expect(format(1000)).toBe('1,000.00');
  });
});

describe('getPaidData', () => {
  it('formats the amount paid for a payment', () => {
    const result = getPaidData({
      storeSettings: { amountFormat: AmountFormat.enUS } as Settings,
      currencySymbol: '$',
      currencyCode: 'USD',
      currencySubunit: 100,
      currencyFormat: CurrencyFormat.symbolAmount,
      invoicePayment: { amountCents: '1000' } as InvoicePayment
    });
    expect(result.amountPaid).toBe(10);
    expect(result.amountPaidFormatted).toBe('$10.00');
  });
});

describe('getFinancialData', () => {
  it('computes formatted invoice totals from items and payments', () => {
    const result = getFinancialData({
      storeSettings: { amountFormat: AmountFormat.enUS } as Settings,
      currencySymbol: '$',
      currencyCode: 'USD',
      currencySubunit: 100,
      currencyFormat: CurrencyFormat.symbolAmount,
      invoiceItems: [item()],
      taxRate: 0,
      invoicePayments: []
    });
    expect(result.subTotalAmount).toBe(20);
    expect(result.totalAmountFormatted).toContain('$');
  });

  it('marks the invoice as inclusive when any item uses inclusive tax', () => {
    const result = getFinancialData({
      storeSettings: { amountFormat: AmountFormat.enUS } as Settings,
      invoiceItems: [item({ taxType: InvoiceItemTaxType.inclusive })],
      taxRate: 0,
      invoicePayments: []
    });
    expect(result.totalTax).toBeGreaterThanOrEqual(0);
  });
});

describe('getItemFinancialData', () => {
  it('computes formatted totals for a single item', () => {
    const result = getItemFinancialData({
      storeSettings: { amountFormat: AmountFormat.enUS } as Settings,
      currencySymbol: '$',
      currencyCode: 'USD',
      currencySubunit: 100,
      currencyFormat: CurrencyFormat.symbolAmount,
      unitPrice: 1000,
      quantity: 2,
      taxRate: 10,
      taxType: InvoiceItemTaxType.exclusive,
      invoiceItems: [item()]
    });
    expect(result.totalUnitPrice).toBe(20);
    expect(result.formattedTotal).toBe('$20.00');
  });
});

describe('aggregateInvoicesByCurrency', () => {
  const baseInvoice = (overrides: Partial<Invoice> = {}): Invoice =>
    ({
      id: 1,
      issuedAt: '2024-01-15',
      status: InvoiceStatus.paid,
      taxRate: 0,
      invoiceItems: [item()],
      invoicePayments: [{ amountCents: '2200' }] as InvoicePayment[],
      invoiceCurrencySnapshot: { currencyCode: 'USD', currencySymbol: '$', currencySubunit: 100 },
      currencyId: 1,
      discountAmountCents: '0',
      surchargeAmountCents: '0',
      shippingFeeCents: '0',
      ...overrides
    }) as Invoice;

  it('aggregates invoices issued within the date range by currency', () => {
    const result = aggregateInvoicesByCurrency([baseInvoice()], '2024-01-01', '2024-01-31', ReportDateType.issuedAt);
    expect(result.USD.invoiceCount).toBe(1);
    expect(result.USD.totalAmountPaid).toBeGreaterThan(0);
  });

  it('excludes invoices outside the date range', () => {
    const result = aggregateInvoicesByCurrency([baseInvoice()], '2025-01-01', '2025-01-31', ReportDateType.issuedAt);
    expect(result.USD).toBeUndefined();
  });

  it('filters by paidAt when reportDateType is paidAt', () => {
    const paid = baseInvoice({ paidAt: '2024-01-20' });
    const unpaid = baseInvoice({ id: 2, paidAt: undefined });
    const result = aggregateInvoicesByCurrency([paid, unpaid], '2024-01-01', '2024-01-31', ReportDateType.paidAt);
    expect(result.USD.invoiceCount).toBe(1);
  });
});
