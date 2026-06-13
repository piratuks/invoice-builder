import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { CurrencyFormat } from '../enums/currencyFormat';
import { DiscountType } from '../enums/discountType';
import { InvoiceStatus } from '../enums/invoiceStatus';
import { ReportDateType } from '../enums/reportDateType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../enums/taxType';
import type { Invoice, InvoiceItem, InvoicePayment, InvoicesByCurrency } from '../types/invoice';
import type { Settings } from '../types/settings';
import { formatAmount, getFormattedCurrency } from './formatFunctions';

export const getDaysLeft = (dueDate?: string) => {
  if (!dueDate) return 0;

  const d = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;

  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return differenceInCalendarDays(due, todayDateOnly);
};

export const calcUnitPrice = (data: { supportsSubunit?: boolean; amountCents: number; subunit?: number }) => {
  const { supportsSubunit, amountCents, subunit } = data;

  if (supportsSubunit && subunit! === 0) return 0;

  const unitPrice = supportsSubunit ? amountCents / subunit! : amountCents;

  return unitPrice;
};

export const calcTax = (amount: number, taxRate: number, taxType?: InvoiceItemTaxType | InvoiceTaxType) => {
  if (!taxType) return 0;
  switch (taxType) {
    case InvoiceItemTaxType.exclusive:
    case InvoiceTaxType.exclusive:
      return (amount * taxRate) / 100;
    case InvoiceItemTaxType.inclusive:
    case InvoiceTaxType.inclusive:
      return (amount * taxRate) / (100 + taxRate);
    case InvoiceTaxType.deducted:
      return -(amount * taxRate) / 100;
    default:
      return 0;
  }
};

export const calcDiscount = (data: {
  subTotal: number;
  discountType?: DiscountType;
  discountAmount?: number;
  discountPercent?: number;
}) => {
  const { subTotal, discountType, discountAmount, discountPercent } = data;

  if (!discountType) return 0;
  return discountType === DiscountType.fixed ? (discountAmount ?? 0) : (subTotal * (discountPercent ?? 0)) / 100;
};

export const getInvoiceItemLevelTaxDiscount = (data: {
  taxRate: number;
  unitPrice: number;
  quantity: number;
  taxType?: InvoiceItemTaxType;
  invoiceItems: InvoiceItem[];
  discountType?: DiscountType;
  discountAmount?: number;
  discountPercent?: number;
}) => {
  const {
    unitPrice,
    quantity,
    taxRate,
    taxType,
    invoiceItems,
    discountType,
    discountAmount = 0,
    discountPercent = 0
  } = data;
  const unitTotal = unitPrice * quantity;
  let discount = 0;
  const subTotal =
    invoiceItems.reduce((sum, item) => {
      return sum + Number(item.invoiceItemSnapshot.unitPriceCents) * Number(item.quantity);
    }, 0) ?? 0;

  const totalDiscount = calcDiscount({ subTotal, discountType, discountAmount, discountPercent });

  if (subTotal > 0 && totalDiscount > 0) {
    discount = Math.round((unitTotal / subTotal) * totalDiscount);
  }

  const taxableAmount = unitTotal - discount;
  const tax = calcTax(taxableAmount, taxRate, taxType);

  return { tax, discount };
};

export const getInvoiceItemTotal = (data: {
  taxRate: number;
  unitPrice: number;
  quantity: number;
  taxType?: InvoiceItemTaxType;
  includeTax?: boolean;
  invoiceItems: InvoiceItem[];
  discountType?: DiscountType;
  discountAmount?: number;
  discountPercent?: number;
}) => {
  const {
    unitPrice,
    quantity,
    includeTax = true,
    taxRate,
    taxType,
    invoiceItems,
    discountType,
    discountAmount = 0,
    discountPercent = 0
  } = data;
  const unitTotal = unitPrice * quantity;
  let discount = 0;
  const subTotal =
    invoiceItems.reduce((sum, item) => {
      return sum + Number(item.invoiceItemSnapshot.unitPriceCents) * Number(item.quantity);
    }, 0) ?? 0;

  const totalDiscount = calcDiscount({ subTotal, discountType, discountAmount, discountPercent });

  if (subTotal > 0 && totalDiscount > 0) {
    discount = Math.round((unitTotal / subTotal) * totalDiscount);
  }

  const taxableAmount = unitTotal - discount;
  const tax = includeTax ? calcTax(taxableAmount, taxRate, taxType) : 0;

  return taxType === InvoiceItemTaxType.inclusive ? unitTotal - discount : unitTotal - discount + tax;
};

export const getInvoiceTotal = (data: {
  taxRate: number;
  taxType?: InvoiceTaxType;
  invoiceItems: InvoiceItem[];
  discountType?: DiscountType;
  discountAmount?: number;
  discountPercent?: number;
  shippingFee?: number;
  includeTax?: boolean;
}) => {
  const {
    taxRate,
    taxType,
    invoiceItems,
    discountType,
    discountAmount = 0,
    discountPercent = 0,
    shippingFee = 0,
    includeTax = true
  } = data;

  const subTotal =
    invoiceItems.reduce((sum, item) => {
      return sum + Number(item.invoiceItemSnapshot.unitPriceCents) * Number(item.quantity);
    }, 0) ?? 0;

  const totalDiscount = calcDiscount({ subTotal, discountType, discountAmount, discountPercent });
  const afterDiscount = subTotal - totalDiscount;
  const taxInvoice = calcTax(afterDiscount, taxRate, taxType);
  let taxItems = 0;
  invoiceItems.map(item => {
    const unitTotal = Number(item.invoiceItemSnapshot.unitPriceCents) * Number(item.quantity);
    let discount = 0;
    if (subTotal > 0 && totalDiscount > 0) {
      discount = Math.round((unitTotal / subTotal) * totalDiscount);
    }
    const taxableAmount = unitTotal - discount;
    if (item.taxType !== InvoiceItemTaxType.inclusive) taxItems += calcTax(taxableAmount, item.taxRate, item.taxType);
  });
  const tax = includeTax ? taxInvoice + taxItems : 0;

  return taxType === InvoiceTaxType.inclusive ? afterDiscount + shippingFee : afterDiscount + tax + shippingFee;
};

export const getPaidAmount = (invoicePayments: InvoicePayment[]) => {
  return invoicePayments.reduce((sum, p) => sum + Number(p.amountCents), 0) ?? 0;
};

export const getBalanceDue = (data: {
  taxRate: number;
  taxType?: InvoiceTaxType;
  invoiceItems: InvoiceItem[];
  discountType?: DiscountType;
  discountAmount?: number;
  discountPercent?: number;
  shippingFee?: number;
  invoicePayments: InvoicePayment[];
}) => {
  const {
    taxRate,
    taxType,
    invoiceItems,
    discountType,
    discountAmount = 0,
    discountPercent = 0,
    shippingFee = 0,
    invoicePayments
  } = data;
  const balanceAmount =
    getInvoiceTotal({
      taxRate,
      taxType,
      invoiceItems,
      discountType,
      discountAmount,
      discountPercent,
      shippingFee
    }) - getPaidAmount(invoicePayments);

  return balanceAmount;
};

export const aggregateInvoicesByCurrency = (
  invoices: Invoice[],
  from: string,
  to: string,
  reportDateType: ReportDateType
): InvoicesByCurrency => {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);

  console.log(invoices, fromDate, toDate, reportDateType);
  const filtered = invoices.filter(inv => {
    const issueDate = parseISO(inv.issuedAt);
    let paidAtDate: Date | undefined = undefined;

    if (inv.paidAt) {
      paidAtDate = parseISO(inv.paidAt);
    }

    if (reportDateType === ReportDateType.issuedAt) {
      return issueDate >= fromDate && issueDate <= toDate;
    }

    if (!paidAtDate) return false;

    return paidAtDate >= fromDate && paidAtDate <= toDate;
  });

  const getInvoicePaidAmount = (invoice: Invoice, totalAmountCents: number) => {
    const amountPaidCents = getPaidAmount(invoice.invoicePayments);

    if (invoice.status === InvoiceStatus.paid && amountPaidCents <= totalAmountCents) {
      return totalAmountCents / invoice.invoiceCurrencySnapshot!.currencySubunit;
    }

    return amountPaidCents / invoice.invoiceCurrencySnapshot!.currencySubunit;
  };

  const result: InvoicesByCurrency = {};

  filtered.forEach(invoice => {
    const code = invoice.invoiceCurrencySnapshot!.currencyCode;
    if (!result[code]) {
      result[code] = {
        currencyCode: code,
        currencySymbol: invoice.invoiceCurrencySnapshot!.currencySymbol,
        totalAmount: 0,
        totalAmountPaid: 0,
        balanceDue: 0,
        invoiceCount: 0,
        overdueCount: 0,
        collectionRate: 0,
        avgPerInvoice: 0,
        issuedAt: invoice.issuedAt,
        currencyId: invoice.currencyId,
        paidAt: invoice.paidAt
      };
    }
    const daysLeft = getDaysLeft(invoice.dueDate);
    const totalAmountCents = getInvoiceTotal({
      taxRate: invoice.taxRate,
      taxType: invoice.taxType,
      invoiceItems: invoice.invoiceItems,
      discountType: invoice.discountType,
      discountAmount: Number(invoice.discountAmountCents),
      discountPercent: invoice.discountPercent,
      shippingFee: Number(invoice.shippingFeeCents)
    });
    const totalAmountPaid = getInvoicePaidAmount(invoice, totalAmountCents);
    const totalAmount = totalAmountCents / invoice.invoiceCurrencySnapshot!.currencySubunit;
    const remaining = totalAmount - totalAmountPaid;

    result[code].totalAmount += totalAmount;
    result[code].totalAmountPaid += totalAmountPaid;
    result[code].balanceDue += remaining;
    result[code].invoiceCount += 1;
    result[code].overdueCount += daysLeft < 0 ? 1 : 0;
  });

  Object.values(result).forEach(group => {
    group.collectionRate = group.totalAmount ? (group.totalAmountPaid / group.totalAmount) * 100 : 0;
    group.avgPerInvoice = group.invoiceCount ? group.totalAmountPaid / group.invoiceCount : 0;
  });

  return result;
};

export const createCurrencyFormatter = (data: {
  storeSettings?: Settings;
  currencySymbol?: string;
  currencyCode?: string;
  currencySubunit?: number;
  currencyFormat?: string;
}) => {
  const { storeSettings, currencySymbol, currencyCode, currencyFormat } = data;

  const supports = supportsCurrencySubunit(data);

  return (amount: number) =>
    supports
      ? getFormattedCurrency({
          amount,
          amountFormat: storeSettings!.amountFormat,
          format: currencyFormat as CurrencyFormat,
          symbol: currencySymbol!,
          code: currencyCode!
        })
      : formatAmount(amount, storeSettings!.amountFormat);
};

export const supportsCurrencySubunit = (data: {
  storeSettings?: Settings;
  currencySymbol?: string;
  currencyCode?: string;
  currencySubunit?: number;
  currencyFormat?: string;
}) => {
  const { storeSettings, currencySymbol, currencyCode, currencySubunit, currencyFormat } = data;
  return Boolean(
    storeSettings &&
    currencySymbol !== undefined &&
    currencyCode !== undefined &&
    currencySubunit !== undefined &&
    currencyFormat !== undefined
  );
};

export const getPaidData = (data: {
  storeSettings?: Settings;
  currencySymbol?: string;
  currencyCode?: string;
  currencySubunit?: number;
  currencyFormat?: string;
  invoicePayment?: InvoicePayment;
}) => {
  const { storeSettings, currencySymbol, currencyCode, currencySubunit, currencyFormat, invoicePayment } = data;

  const supportsSubunit = supportsCurrencySubunit({
    storeSettings,
    currencySymbol,
    currencyCode,
    currencySubunit,
    currencyFormat
  });
  const localFormat = createCurrencyFormatter({
    storeSettings,
    currencySymbol,
    currencyCode,
    currencySubunit,
    currencyFormat
  });

  const amountPaid = calcUnitPrice({
    supportsSubunit,
    amountCents: Number(invoicePayment?.amountCents ?? 0),
    subunit: currencySubunit
  });

  return {
    amountPaid,
    amountPaidFormatted: localFormat(amountPaid)
  };
};

export const getFinancialData = (data: {
  storeSettings?: Settings;
  currencySymbol?: string;
  currencyCode?: string;
  currencySubunit?: number;
  currencyFormat?: string;
  invoiceItems: InvoiceItem[];
  discountType?: DiscountType;
  discountAmount?: number;
  discountPercent?: number;
  taxRate: number;
  shippingAmount?: number;
  taxType?: InvoiceTaxType;
  invoicePayments: InvoicePayment[];
}) => {
  const {
    storeSettings,
    currencySymbol,
    currencyCode,
    currencySubunit,
    currencyFormat,
    invoiceItems,
    discountType,
    discountAmount = 0,
    discountPercent = 0,
    shippingAmount = 0,
    taxRate,
    taxType,
    invoicePayments
  } = data;

  const supportsSubunit = supportsCurrencySubunit({
    storeSettings,
    currencySymbol,
    currencyCode,
    currencySubunit,
    currencyFormat
  });
  const format = createCurrencyFormatter({
    storeSettings,
    currencySymbol,
    currencyCode,
    currencySubunit,
    currencyFormat
  });

  let isInclusive = false;
  let subTotalAmount = 0;
  let totalItemTaxAmount = 0;
  invoiceItems?.forEach(item => {
    const subTotal = getInvoiceItemTotal({
      taxRate: item.taxRate,
      unitPrice: Number(item.invoiceItemSnapshot.unitPriceCents),
      quantity: Number(item.quantity),
      taxType: item.taxType,
      includeTax: false,
      invoiceItems
    });
    const { tax: itemLevelTax } = getInvoiceItemLevelTaxDiscount({
      taxRate: item.taxRate,
      unitPrice: Number(item.invoiceItemSnapshot.unitPriceCents),
      quantity: Number(item.quantity),
      taxType: item.taxType,
      invoiceItems,
      discountType,
      discountAmount,
      discountPercent
    });

    totalItemTaxAmount += itemLevelTax;
    subTotalAmount += subTotal;

    if (item.taxType === InvoiceItemTaxType.inclusive) {
      isInclusive = true;
    }
  });
  if (!isInclusive && taxType === InvoiceTaxType.inclusive) {
    isInclusive = true;
  }

  const calculatedDiscountAmount = calcDiscount({
    subTotal: subTotalAmount,
    discountAmount,
    discountPercent,
    discountType
  });
  const totalAmountAfterDiscount = subTotalAmount - calculatedDiscountAmount;
  const invoiceLevelTax = calcTax(totalAmountAfterDiscount, taxRate, taxType);
  const taxTotalAmount = totalItemTaxAmount + invoiceLevelTax;
  let totalAmount = totalAmountAfterDiscount + shippingAmount;

  if (!isInclusive) {
    totalAmount += taxTotalAmount;
  }
  const paidAmount = getPaidAmount(invoicePayments);
  const balanceDue = totalAmount - paidAmount;

  const finalShippingAmount = calcUnitPrice({
    supportsSubunit,
    amountCents: shippingAmount,
    subunit: currencySubunit
  });
  const finalSubTotalAmount = calcUnitPrice({
    supportsSubunit,
    amountCents: subTotalAmount,
    subunit: currencySubunit
  });
  const finalTaxTotalAmount = calcUnitPrice({
    supportsSubunit,
    amountCents: taxTotalAmount,
    subunit: currencySubunit
  });
  const finalDiscountAmount = calcUnitPrice({
    supportsSubunit,
    amountCents: calculatedDiscountAmount,
    subunit: currencySubunit
  });
  const finalTotalAmount = calcUnitPrice({
    supportsSubunit,
    amountCents: totalAmount,
    subunit: currencySubunit
  });
  const finalPaidAmount = calcUnitPrice({
    supportsSubunit,
    amountCents: paidAmount,
    subunit: currencySubunit
  });
  const finalBalanceDue = calcUnitPrice({
    supportsSubunit,
    amountCents: balanceDue,
    subunit: currencySubunit
  });

  return {
    formattedSubTotalAmount: format(finalSubTotalAmount),
    formattedTotalTaxAmount: format(finalTaxTotalAmount),
    discountAmountFormatted: format(finalDiscountAmount),
    shippingAmountFormatted: format(finalShippingAmount),
    totalAmountFormatted: format(finalTotalAmount),
    totalAmountPaidFormatted: format(finalPaidAmount),
    balanceDueFormatted: format(finalBalanceDue),
    subTotalAmount: finalSubTotalAmount,
    totalTax: finalTaxTotalAmount,
    discountAmount: finalDiscountAmount,
    shippingAmount: finalShippingAmount,
    totalAmount: finalTotalAmount,
    totalAmountPaid: finalPaidAmount,
    balanceDue: finalBalanceDue
  };
};

export const getItemFinancialData = (data: {
  storeSettings?: Settings;
  currencySymbol?: string;
  currencyCode?: string;
  currencySubunit?: number;
  currencyFormat?: string;
  unitPrice: number;
  quantity: number;
  taxType?: InvoiceItemTaxType;
  taxRate: number;
  invoiceItems: InvoiceItem[];
  discountType?: DiscountType;
  discountAmount?: number;
  discountPercent?: number;
}) => {
  const {
    storeSettings,
    currencySymbol,
    currencyCode,
    currencySubunit,
    currencyFormat,
    unitPrice,
    discountType,
    discountAmount = 0,
    discountPercent = 0,
    quantity,
    taxType,
    taxRate,
    invoiceItems
  } = data;

  const supportsSubunit = supportsCurrencySubunit({
    storeSettings,
    currencySymbol,
    currencyCode,
    currencySubunit,
    currencyFormat
  });
  const format = createCurrencyFormatter({
    storeSettings,
    currencySymbol,
    currencyCode,
    currencySubunit,
    currencyFormat
  });
  const totalUnitPrice = unitPrice * quantity;
  const { tax: itemLevelTax, discount: itemLevelDiscount } = getInvoiceItemLevelTaxDiscount({
    taxRate: taxRate,
    unitPrice: unitPrice,
    quantity: quantity,
    taxType: taxType,
    invoiceItems,
    discountType,
    discountAmount,
    discountPercent
  });
  const finalUnitPriceTotal = calcUnitPrice({
    supportsSubunit: supportsSubunit,
    amountCents: totalUnitPrice,
    subunit: currencySubunit
  });
  const finalUnitPrice = calcUnitPrice({
    supportsSubunit: supportsSubunit,
    amountCents: unitPrice,
    subunit: currencySubunit
  });
  const finalItemTax = calcUnitPrice({
    supportsSubunit: supportsSubunit,
    amountCents: itemLevelTax,
    subunit: currencySubunit
  });
  const finalItemDiscount = calcUnitPrice({
    supportsSubunit: supportsSubunit,
    amountCents: itemLevelDiscount,
    subunit: currencySubunit
  });

  return {
    formattedUnitPrice: format(finalUnitPrice),
    formattedTotal: format(finalUnitPriceTotal),
    formattedTax: format(finalItemTax),
    formattedItemDiscountAmount: format(finalItemDiscount),
    unitPrice: finalUnitPrice,
    totalUnitPrice: finalUnitPriceTotal,
    invoiceTaxAmount: finalItemTax,
    itemDiscountAmount: finalItemDiscount
  };
};
