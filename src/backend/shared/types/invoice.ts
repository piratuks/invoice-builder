import type { Alignment } from '../enums/alignment';
import type { DiscountType } from '../enums/discountType';
import type { FontFamily } from '../enums/fontFamily';
import type { InvoiceStatus } from '../enums/invoiceStatus';
import type { InvoiceType } from '../enums/invoiceType';
import type { Language } from '../enums/language';
import type { LayoutType } from '../enums/layoutType';
import type { PageFormat } from '../enums/pageFormat';
import type { SizeType } from '../enums/sizeType';
import type { TableHeaderStyle } from '../enums/tableHeaderStyle';
import type { TableRowStyle } from '../enums/tableRowStyle';
import type { InvoiceItemTaxType, InvoiceTaxType } from '../enums/taxType';
import type { PDFText } from './pdfText';
import type { SortOrder } from './sortOrder';

export interface InvoiceSequence {
  id?: number;
  businessId?: number;
  clientId?: number;
  nextSequence: number;
  createdAt?: string;
  updatedAt?: string;
}
export interface InvoiceItemSnapshots {
  parentInvoiceItemId: number;
  id?: number;
  itemName: string;
  unitPriceCents: string;
  unitName?: string;
}

export interface InvoiceCurrencySnapshots {
  parentInvoiceId: number;
  id?: number;
  currencyCode: string;
  currencySymbol: string;
  currencySubunit: number;
}

export interface InvoiceClientSnapshots {
  parentInvoiceId: number;
  id?: number;
  clientName: string;
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

export interface InvoiceBankSnapshots {
  parentInvoiceId: number;
  id?: number;
  name: string;
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
  qrCode?: Uint8Array;
}

export interface InvoiceBusinessSnapshots {
  parentInvoiceId: number;
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
  businessLogo?: Uint8Array;
  businessFileSize?: number;
  businessFileType?: string;
  businessFileName?: string;
  businessVatCode?: string;
  businessPeppolEndpointId?: string;
  businessCountryCode?: string;
  businessCode?: string;
  businessPeppolEndpointSchemeId?: string;
}

export interface InvoiceStyleProfileSnapshots {
  parentInvoiceId: number;
  id?: number;
  styleProfileName?: string;
}

export interface InvoiceCustomization {
  parentInvoiceId: number;
  id?: number;
  color: string;
  logoSize: SizeType;
  fontSize: SizeType;
  fontFamily: FontFamily;
  layout: LayoutType;
  tableHeaderStyle: TableHeaderStyle;
  tableRowStyle: TableRowStyle;
  pageFormat: PageFormat;
  labelUpperCase: boolean;
  watermarkFileName?: string;
  watermarkFileType?: string;
  watermarkFileSize?: number;
  watermarkFileData?: Uint8Array;
  paidWatermarkFileName?: string;
  paidWatermarkFileType?: string;
  paidWatermarkFileSize?: number;
  paidWatermarkFileData?: Uint8Array;
  showQuantity: boolean;
  showUnit: boolean;
  showRowNo: boolean;
  fieldSortOrders: SortOrder | string;
  pdfTexts?: PDFText | string;
}

export interface Invoice {
  id?: number;
  invoiceType: InvoiceType;
  convertedFromQuotationId?: number;
  businessId: number;
  clientId: number;
  bankId?: number;
  currencyId: number;
  createdAt: string;
  updatedAt: string;
  issuedAt: string;
  paidAt?: string;
  closedAt?: string;
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
  invoiceAttachments: InvoiceAttachment[];
  language: Language;
  signatureData?: Uint8Array;
  signatureSize?: number;
  signatureType?: string;
  signatureName?: string;
  styleProfilesId?: number;
  invoiceStyleProfileSnapshot?: InvoiceStyleProfileSnapshots;
  invoiceCustomization?: InvoiceCustomization;
  invoiceBankSnapshot?: InvoiceBankSnapshots;
  invoiceBusinessSnapshot?: InvoiceBusinessSnapshots;
  invoiceClientSnapshot?: InvoiceClientSnapshots;
  invoiceCurrencySnapshot?: InvoiceCurrencySnapshots;
}

export interface InvoiceAttachment {
  id: number;
  parentInvoiceId: number;
  fileSize: number;
  fileType: string;
  fileName: string;
  data: Uint8Array;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePayment {
  id: number;
  parentInvoiceId: number;
  amountCents: string;
  paidAt: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldMeta {
  header: string;
  alignment: Alignment;
  sortOrder: number;
}

export interface CustomField extends CustomFieldMeta {
  value: string;
}

export interface InvoiceItem {
  id: number;
  parentInvoiceId: number;
  itemId: number;
  invoiceItemSnapshot?: InvoiceItemSnapshots;
  quantity: string;
  customField?: CustomField | string;
  createdAt: string;
  updatedAt: string;
  taxRate: number;
  taxType?: InvoiceItemTaxType;
}
