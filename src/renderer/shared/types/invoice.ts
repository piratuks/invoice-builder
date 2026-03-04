import type { Alignment } from '../enums/alignment';
import type { DiscountType } from '../enums/discountType';
import type { FontFamily } from '../enums/fontFamily';
import type { InvoiceStatus } from '../enums/invoiceStatus';
import type { InvoiceType } from '../enums/invoiceType';
import type { Language } from '../enums/language';
import type { LayoutType } from '../enums/layoutType';
import type { PageFormat } from '../enums/pageFormat';
import type { PaymentType } from '../enums/paymentType';
import type { SizeType } from '../enums/sizeType';
import type { TableHeaderStyle } from '../enums/tableHeaderStyle';
import type { TableRowStyle } from '../enums/tableRowStyle';
import type { InvoiceItemTaxType, InvoiceTaxType } from '../enums/taxType';
import type { PDFText } from './pdfText';
import type { SortOrder } from './sortOrder';

export interface CustomFieldMeta {
  header: string;
  alignment: Alignment;
  sortOrder: number;
}

export interface CustomField extends CustomFieldMeta {
  value: string;
}

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

export interface InvoiceBankSnapshotsMeta {
  parentInvoiceId?: number;
  id?: number;
  name?: string;
  bankName?: string;
  accountNumber?: string;
  swiftCode?: string;
  address?: string;
  branchCode?: string;
  type?: string;
  routingNumber?: string;
  accountHolder?: string;
  sortOrder?: string;
  upiCode?: string;
  qrCodeFileSize?: number;
  qrCodeFileType?: string;
  qrCodeFileName?: string;
}

export interface InvoiceBankSnapshots extends InvoiceBankSnapshotsMeta {
  qrCode?: Uint8Array;
}

export interface InvoiceBankSnapshotsWeb extends InvoiceBankSnapshotsMeta {
  qrCode?: string;
}

export interface InvoiceStyleProfileSnapshots {
  parentInvoiceId?: number;
  id?: number;
  styleProfileName?: string;
}

export interface InvoiceCustomizationMeta {
  parentInvoiceId?: number;
  id?: number;
  color?: string;
  logoSize?: SizeType;
  fontSize?: SizeType;
  fontFamily?: FontFamily;
  layout?: LayoutType;
  tableHeaderStyle?: TableHeaderStyle;
  tableRowStyle?: TableRowStyle;
  pageFormat?: PageFormat;
  labelUpperCase?: boolean;
  watermarkFileName?: string;
  watermarkFileType?: string;
  watermarkFileSize?: number;
  paidWatermarkFileName?: string;
  paidWatermarkFileType?: string;
  paidWatermarkFileSize?: number;
  showQuantity?: boolean;
  showUnit?: boolean;
  showRowNo?: boolean;
  fieldSortOrders: SortOrder;
  pdfTexts?: PDFText;
}

export interface InvoiceCustomization extends InvoiceCustomizationMeta {
  watermarkFileData?: Uint8Array;
  paidWatermarkFileData?: Uint8Array;
}

export interface InvoiceCustomizationWeb extends InvoiceCustomizationMeta {
  watermarkFileData?: string;
  paidWatermarkFileData?: string;
}

export interface CustomizationFormPageSetup {
  pageFormat?: PageFormat;
  layout?: LayoutType;
  fontSize?: SizeType;
  fontFamily?: FontFamily;
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
  layout?: LayoutType;
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
}

export interface DiscountForm {
  discountType?: DiscountType;
  discountAmount?: number;
  discountRate?: number;
  discountName?: string;
}
export interface InvoicePayment {
  id?: number;
  parentInvoiceId?: number;
  amountCents: string;
  paidAt: string;
  paymentMethod: PaymentType;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceAttachmentMeta {
  id?: number;
  parentInvoiceId?: number;
  fileSize: number;
  fileType: string;
  fileName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceAttachment extends InvoiceAttachmentMeta {
  data: Uint8Array;
}

export interface InvoiceAttachmentWeb extends InvoiceAttachmentMeta {
  data: string;
}

export interface InvoiceItemSnapshots {
  parentInvoiceItemId: number;
  id?: number;
  itemName: string;
  unitPriceCents: string;
  unitName?: string;
}

export interface InvoiceItem {
  id?: number;
  parentInvoiceId?: number;
  itemId: number;
  invoiceItemSnapshot: InvoiceItemSnapshots;
  quantity: string;
  customField?: CustomField;
  createdAt?: string;
  updatedAt?: string;
  taxRate: number;
  taxType?: InvoiceItemTaxType;
}

export interface InvoiceCurrencySnapshots {
  parentInvoiceId?: number;
  id?: number;
  currencyCode: string;
  currencySymbol: string;
  currencySubunit: number;
}

export interface InvoiceClientSnapshots {
  parentInvoiceId?: number;
  id?: number;
  clientName?: string;
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCode?: string;
  clientAdditional?: string;
  clientVatCode?: string;
  clientPeppolEndpointId?: string;
  clientCountryCode?: string;
  clientPeppolEndpointSchemeId?: string;
  clientBuyerReference?: string;
}

export interface InvoiceBusinessSnapshotsMeta {
  parentInvoiceId?: number;
  id?: number;
  businessName: string;
  businessAddress?: string;
  businessRole?: string;
  businessShortName: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAdditional?: string;
  // Legacy payment info. New payment info is via Bank
  businessPaymentInformation?: string;
  businessFileSize?: number;
  businessFileType?: string;
  businessFileName?: string;
  businessVatCode?: string;
  businessPeppolEndpointId?: string;
  businessCountryCode?: string;
  businessCode?: string;
  businessPeppolEndpointSchemeId?: string;
}

export interface InvoiceBusinessSnapshots extends InvoiceBusinessSnapshotsMeta {
  businessLogo?: Uint8Array;
}

export interface InvoiceBusinessSnapshotsWeb extends InvoiceBusinessSnapshotsMeta {
  businessLogo?: string;
}

export interface InvoiceMeta {
  id: number;
  invoiceType: InvoiceType;
  convertedFromQuotationId?: number;
  invoiceFullNumber: string;
  businessId: number;
  bankId?: number;
  clientId: number;
  currencyId: number;
  createdAt: string;
  updatedAt: string;
  issuedAt: string;
  dueDate?: string;
  invoiceNumber: string;
  isArchived: boolean;
  status: InvoiceStatus;
  customerNotes?: string;
  thanksNotes?: string;
  termsConditionNotes?: string;
  discountName?: string;
  invoicePrefix?: string;
  invoiceSuffix?: string;
  discountType?: DiscountType;
  discountAmountCents: string;
  discountPercent: number;
  shippingFeeCents: string;
  taxName?: string;
  taxRate: number;
  taxType?: InvoiceTaxType;
  invoicePayments: InvoicePayment[];
  invoiceItems: InvoiceItem[];
  currencyFormat: string;
  language: Language;
  signatureSize?: number;
  signatureType?: string;
  signatureName?: string;
  styleProfilesId?: number;
  invoiceStyleProfileSnapshot?: InvoiceStyleProfileSnapshots;
  invoiceClientSnapshot?: InvoiceClientSnapshots;
  invoiceCurrencySnapshot?: InvoiceCurrencySnapshots;
}

export interface Invoice extends InvoiceMeta {
  signatureData?: Uint8Array;
  invoiceAttachments: InvoiceAttachment[];
  invoiceBusinessSnapshot?: InvoiceBusinessSnapshots;
  invoiceCustomization?: InvoiceCustomization;
  invoiceBankSnapshot?: InvoiceBankSnapshots;
}

export interface InvoiceWeb extends InvoiceMeta {
  signatureData?: string | null;
  invoiceAttachments: InvoiceAttachmentWeb[];
  invoiceBusinessSnapshot?: InvoiceBusinessSnapshotsWeb;
  invoiceCustomization?: InvoiceCustomizationWeb;
  invoiceBankSnapshot?: InvoiceBankSnapshotsWeb;
}
export interface InvoiceAddMeta {
  invoiceType?: InvoiceType;
  convertedFromQuotationId?: number;
  businessId?: number;
  bankId?: number;
  clientId?: number;
  currencyId?: number;
  issuedAt?: string;
  dueDate?: string;
  invoiceNumber?: string;
  isArchived?: boolean;
  status?: InvoiceStatus;
  customerNotes?: string;
  thanksNotes?: string;
  invoicePrefix?: string;
  invoiceSuffix?: string;
  termsConditionNotes?: string;
  discountName?: string;
  discountType?: DiscountType;
  discountAmountCents?: string;
  discountPercent?: number;
  shippingFeeCents?: string;
  taxName?: string;
  taxRate?: number;
  taxType?: InvoiceTaxType;
  invoicePayments?: InvoicePayment[];
  invoiceItems?: InvoiceItem[];
  currencyFormat?: string;
  language?: Language;
  signatureSize?: number;
  signatureType?: string;
  signatureName?: string;
  styleProfilesId?: number;
  invoiceStyleProfileSnapshot?: InvoiceStyleProfileSnapshots;
  invoiceClientSnapshot?: InvoiceClientSnapshots;
  invoiceCurrencySnapshot?: InvoiceCurrencySnapshots;
}

export interface InvoiceAdd extends InvoiceAddMeta {
  signatureData?: Uint8Array;
  invoiceAttachments?: InvoiceAttachment[];
  invoiceBusinessSnapshot?: InvoiceBusinessSnapshots;
  invoiceCustomization?: InvoiceCustomization;
  invoiceBankSnapshot?: InvoiceBankSnapshots;
}

export interface InvoiceUpdate extends InvoiceAdd {
  id: number;
}

export interface InvoiceAddWeb extends InvoiceAddMeta {
  signatureData?: string | null;
  invoiceAttachments?: InvoiceAttachmentWeb[];
  invoiceBusinessSnapshot?: InvoiceBusinessSnapshotsWeb;
  invoiceCustomization?: InvoiceCustomizationWeb;
  invoiceBankSnapshot?: InvoiceBankSnapshotsWeb;
}

export interface InvoiceUpdateWeb extends InvoiceAddWeb {
  id: number;
}

export interface InvoiceFromData {
  id?: number;
  invoiceType?: InvoiceType;
  convertedFromQuotationId?: number;
  businessId?: number;
  bankId?: number;
  clientId?: number;
  currencyId?: number;
  issuedAt?: string;
  dueDate?: string;
  invoiceNumber?: string;
  isArchived?: boolean;
  status?: InvoiceStatus;
  customerNotes?: string;
  thanksNotes?: string;
  invoicePrefix?: string;
  invoiceSuffix?: string;
  termsConditionNotes?: string;
  discountName?: string;
  discountType?: DiscountType;
  discountAmountCents?: string;
  discountPercent?: number;
  shippingFeeCents?: string;
  taxName?: string;
  taxRate?: number;
  taxType?: InvoiceTaxType;
  invoicePayments?: InvoicePayment[];
  invoiceItems?: InvoiceItem[];
  invoiceAttachments?: InvoiceAttachment[];
  invoiceBankSnapshot?: InvoiceBankSnapshots;
  invoiceBusinessSnapshot?: InvoiceBusinessSnapshots;
  invoiceClientSnapshot?: InvoiceClientSnapshots;
  invoiceCurrencySnapshot?: InvoiceCurrencySnapshots;
  invoiceCustomization?: InvoiceCustomization;
  invoiceStyleProfileSnapshot?: InvoiceStyleProfileSnapshots;
  currencyFormat?: string;
  language?: Language;
  signatureData?: Uint8Array;
  signatureSize?: number;
  signatureType?: string;
  signatureName?: string;
  styleProfilesId?: number;
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
