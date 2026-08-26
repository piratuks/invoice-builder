import { DiscountType } from '../../enums/discountType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../../enums/taxType';
import type { CalculatedInvoice, CalculatedLine } from '../../types/einvoice';
import type { Invoice, InvoiceItem, InvoicePayment } from '../../types/invoice';

export const getTotalAmountPaidCents = (invoicePayments: InvoicePayment[]): number => {
  if (!invoicePayments || invoicePayments.length === 0) {
    return 0;
  }

  const totalCents = invoicePayments.reduce((sum, p) => sum + Number(p.amountCents), 0);
  return totalCents;
};

export const getTotalUnitPrice = (data: { unitPrice: number; quantity: string }): number => {
  const { unitPrice, quantity } = data;

  return unitPrice * Number(quantity);
};

export const getInvoiceItemAmount = (invoiceItem: InvoiceItem): number => {
  return getTotalUnitPrice({
    unitPrice: Number(invoiceItem.invoiceItemSnapshot!.unitPriceCents),
    quantity: invoiceItem.quantity
  });
};

export const calculateSurcharge = (subtotalNet: number, invoice: Invoice): number => {
  if (!invoice.surchargeType) return 0;

  let surcharge = 0;

  if (invoice.surchargeType === DiscountType.fixed) {
    surcharge = Number(invoice.surchargeAmountCents);
  } else {
    surcharge = (subtotalNet * Number(invoice.surchargePercent)) / 100;
  }

  return surcharge;
};

export const calculateDiscount = (subtotalNet: number, invoice: Invoice): number => {
  if (!invoice.discountType) return 0;

  let discount = 0;

  if (invoice.discountType === DiscountType.fixed) {
    discount = Number(invoice.discountAmountCents);
  } else {
    discount = (subtotalNet * Number(invoice.discountPercent)) / 100;
  }

  return discount;
};

export const aggregateVat = (lines: CalculatedLine[]) => {
  const map = new Map<number, { taxable: number; tax: number }>();

  lines.forEach(line => {
    const existing = map.get(line.taxRate) ?? { taxable: 0, tax: 0 };
    existing.taxable += line.lineAmount;
    existing.tax += line.taxAmount;
    map.set(line.taxRate, existing);
  });

  return Array.from(map.entries()).map(([rate, data]) => ({
    rate,
    taxable: data.taxable,
    tax: data.tax
  }));
};

export const calculateInvoiceTotals = (invoice: Invoice): CalculatedInvoice => {
  const totalGrossCents = invoice.invoiceItems.reduce((sum, item) => sum + getInvoiceItemAmount(item), 0);
  const discountCents = calculateDiscount(totalGrossCents, invoice);
  const surchargeCents = calculateSurcharge(totalGrossCents, invoice);

  const lines = invoice.invoiceItems.map(line =>
    calculateInvoiceLine(line, discountCents, totalGrossCents, invoice.taxRate, invoice.taxType)
  );

  const subtotalNet = lines.reduce((sum, l) => sum + l.lineAmount, 0);
  const taxTotal = lines.reduce((sum, l) => sum + l.taxAmount, 0);
  const shippingTotal = Number(invoice.shippingFeeCents || 0);

  const vatGroups = aggregateVat(lines);

  const payableTotal = subtotalNet + taxTotal + shippingTotal + surchargeCents;

  return {
    lines,
    subtotalNet,
    discountTotal: discountCents,
    shippingTotal,
    surchargeTotal: surchargeCents,
    taxTotal,
    payableTotal,
    vatGroups
  };
};

export const calculateInvoiceLine = (
  item: InvoiceItem,
  totalDiscountCents: number,
  totalGrossCents: number,
  invoiceTaxRate: number,
  invoiceTaxType?: InvoiceTaxType
): CalculatedLine => {
  const quantity = Number(item.quantity);
  const grossCents = getInvoiceItemAmount(item);

  const discountPortion = totalGrossCents ? Math.round((grossCents / totalGrossCents) * totalDiscountCents) : 0;

  const rate = item.taxType != undefined ? item.taxRate : invoiceTaxRate;

  let newTaxType = invoiceTaxType;
  if (!newTaxType && item.taxType) {
    if (item.taxType === InvoiceItemTaxType.exclusive) {
      newTaxType = InvoiceTaxType.exclusive;
    } else {
      newTaxType = InvoiceTaxType.inclusive;
    }
  }

  let netCents: number;
  let taxCents: number;

  switch (newTaxType) {
    case InvoiceTaxType.exclusive:
      netCents = grossCents - discountPortion;
      taxCents = (netCents * rate) / 100;
      break;
    case InvoiceTaxType.inclusive:
      netCents = (grossCents - discountPortion) / (1 + rate / 100);
      taxCents = grossCents - discountPortion - netCents;
      break;
    case InvoiceTaxType.deducted:
      netCents = grossCents - discountPortion;
      taxCents = -(netCents * rate) / 100;
      break;
    default:
      netCents = grossCents - discountPortion;
      taxCents = 0;
  }

  return {
    lineAmount: netCents,
    unitAmount: quantity ? netCents / quantity : 0,
    taxAmount: taxCents,
    taxRate: rate,
    taxCategoryId: rate > 0 ? 'S' : 'Z',
    grossAmount: grossCents,
    discountAmount: discountPortion
  };
};
