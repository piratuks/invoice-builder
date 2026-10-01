import type {
  Alignment,
  CustomField,
  DiscountType,
  FontFamily,
  InvoiceItem,
  InvoiceTaxType,
  InvoiceType,
  LayoutSchemaAny,
  PageFormat,
  PaymentType,
  PDFText,
  SizeType,
  SortOrder,
  TableHeaderStyle,
  TableRowStyle
} from '@invoice-builder/contracts';

export interface PdfTexts {
  billTo: string;
  invoiceNo: string;
  quoteNo: string;
  date: string;
  dueDate: string;
  customerNote: string;
  termsConditions: string;
  of: string;
  page: string;
  paymentInfo: string;
  pdfINVOICE: string;
  pdfQUOTE: string;
  subTotalLabel: string;
  discountLabel: string;
  surchargeLabel: string;
  incLabel: string;
  taxLabel: string;
  taxExclusivePerItemLabel: string;
  taxInclusivePerItemLabel: string;
  shippingFeeLabel: string;
  totalLabel: string;
  paidLabel: string;
  balanceDueLabel: string;
  itemLabel: string;
  unitLabel: string;
  qtyLabel: string;
  unitCostLabel: string;
  authorisedSignatoryLabel: string;
}

export interface AttachmentURL {
  id: number;
  url?: string;
}

export interface InvoicesByCurrencyMeta {
  currencyCode: string;
  currencySymbol: string;
  totalAmount: number;
  totalAmountPaid: number;
  balanceDue: number;
  invoiceCount: number;
  overdueCount: number;
  collectionRate: number;
  avgPerInvoice: number;
  issuedAt: string;
  paidAt?: string;
  currencyId: number;
}
export interface InvoicesByCurrency {
  [currencyCode: string]: InvoicesByCurrencyMeta;
}

export interface ItemForm {
  quantity: number | undefined;
  unitPrice: number | undefined;
  header?: string;
  value?: string;
  sortOrder?: number;
  alignment?: Alignment;
}

export interface SignatureForm {
  data?: Uint8Array;
  size?: number;
  type?: string;
  name?: string;
}

export interface PaymentForm {
  id?: number;
  paymentMethod?: PaymentType;
  paidAmount?: number;
  paidAt?: string;
  notes?: string;
}
export interface TaxForm {
  taxType?: InvoiceTaxType;
  taxRate?: number;
  taxName?: string;
  invoiceItems: InvoiceItem[];
}
export interface AttachmentForm {
  fileSize: number;
  fileType: string;
  fileName: string;
  data: Uint8Array;
}

export interface CustomizationFormPageSetup {
  pageFormat?: PageFormat;
  fontSize?: SizeType;
  fontFamily?: FontFamily;
  layoutId?: number;
  layoutSchema?: LayoutSchemaAny;
}

export interface CustomizationFormBranding {
  color?: string;
  logoSize?: SizeType;
  watermarkFileName?: string;
  watermarkFileType?: string;
  watermarkFileSize?: number;
  watermarkFileData?: Uint8Array;
  paidWatermarkFileName?: string;
  paidWatermarkFileType?: string;
  paidWatermarkFileSize?: number;
  paidWatermarkFileData?: Uint8Array;
}

export interface CustomizationFormTable {
  tableHeaderStyle?: TableHeaderStyle;
  tableRowStyle?: TableRowStyle;
  showQuantity?: boolean;
  showUnit?: boolean;
  showRowNo?: boolean;
  fieldSortOrders?: SortOrder;
  customField?: CustomField[];
}

export interface CustomizationFormTypographyLabels {
  pdfTexts?: PDFText;
  labelUpperCase?: boolean;
}

export interface CustomizationForm {
  color?: string;
  logoSize?: SizeType;
  fontSize?: SizeType;
  fontFamily?: FontFamily;
  tableHeaderStyle?: TableHeaderStyle;
  tableRowStyle?: TableRowStyle;
  pageFormat?: PageFormat;
  labelUpperCase?: boolean;
  watermarkFileName?: string;
  watermarkFileType?: string;
  watermarkFileSize?: number;
  watermarkFileData?: Uint8Array;
  paidWatermarkFileName?: string;
  paidWatermarkFileType?: string;
  paidWatermarkFileSize?: number;
  paidWatermarkFileData?: Uint8Array;
  showQuantity?: boolean;
  showUnit?: boolean;
  showRowNo?: boolean;
  fieldSortOrders?: SortOrder;
  pdfTexts?: PDFText;
  customField?: CustomField[];
  layoutId?: number;
  layoutSchema?: LayoutSchemaAny;
}

export interface DiscountForm {
  discountType?: DiscountType;
  discountAmount?: number;
  discountRate?: number;
  discountName?: string;
}
export interface SurchargeForm {
  surchargeType?: DiscountType;
  surchargeAmount?: number;
  surchargeRate?: number;
  surchargeName?: string;
}

export interface InvoiceInfo {
  id?: number;
  issuedAt?: string;
  invoiceType?: InvoiceType;
  invoiceNumber?: string;
  dueDate?: string;
  invoicePrefix?: string;
  invoiceSuffix?: string;
  businessId?: number;
  clientId?: number;
}
