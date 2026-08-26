export interface CalculatedLine {
  lineAmount: number;
  unitAmount: number;
  taxAmount: number;
  taxRate: number;
  taxCategoryId: 'S' | 'Z';
  grossAmount: number;
  discountAmount: number;
}

export interface CalculatedInvoice {
  lines: CalculatedLine[];
  subtotalNet: number;
  discountTotal: number;
  shippingTotal: number;
  surchargeTotal: number;
  taxTotal: number;
  payableTotal: number;
  vatGroups: { rate: number; taxable: number; tax: number }[];
}
