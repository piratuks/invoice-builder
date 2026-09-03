import type { FontFamily } from '../enums/fontFamily';
import type { Language } from '../enums/language';
import type { PageFormat } from '../enums/pageFormat';
import type { SizeType } from '../enums/sizeType';
import type { TableHeaderStyle } from '../enums/tableHeaderStyle';
import type { TableRowStyle } from '../enums/tableRowStyle';
import type { LayoutSchema } from './layouts';
import type { PDFText } from './pdfText';
import type { SortOrder } from './sortOrder';

export interface Preset {
  id?: number;
  name: string;
  //business
  businessId?: number;
  businessName?: string;
  businessAddress?: string;
  businessRole?: string;
  businessShortName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAdditional?: string;
  businessFileSize?: number;
  businessFileType?: string;
  businessFileName?: string;
  businessVatCode?: string;
  businessLogo?: Uint8Array;
  //client
  clientId?: number;
  clientName?: string;
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCode?: string;
  clientAdditional?: string;
  clientVatCode?: string;
  //currency
  currencyId?: number;
  currencyCode?: string;
  currencySymbol?: string;
  currencySubunit?: number;
  currencyFormat?: string;
  //bank
  bankId?: number;
  bankLabel?: string;
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
  layoutId?: number;
  layoutSchema?: LayoutSchema;
  //style profile
  styleProfilesId?: number;
  styleProfileName?: string;
  styleProfileColor?: string;
  styleProfileLogoSize?: SizeType;
  styleProfileFontSize?: SizeType;
  styleProfileFontFamily?: FontFamily;
  styleProfileTableHeaderStyle?: TableHeaderStyle;
  styleProfileTableRowStyle?: TableRowStyle;
  styleProfilePageFormat?: PageFormat;
  styleProfileLabelUpperCase?: boolean;
  styleProfileWatermarkFileName?: string;
  styleProfileWatermarkFileType?: string;
  styleProfileWatermarkFileSize?: number;
  styleProfileWatermarkFileData?: Uint8Array;
  styleProfilePaidWatermarkFileName?: string;
  styleProfilePaidWatermarkFileType?: string;
  styleProfilePaidWatermarkFileSize?: number;
  styleProfilePaidWatermarkFileData?: Uint8Array;
  styleProfileShowQuantity?: boolean;
  styleProfileShowUnit?: boolean;
  styleProfileShowRowNo?: boolean;
  styleProfileFieldSortOrders?: SortOrder | string;
  styleProfilePdfTexts?: PDFText | string;
  //the rest
  customerNotes?: string;
  thanksNotes?: string;
  termsConditionNotes?: string;
  language?: Language;
  signatureData?: Uint8Array;
  signatureSize?: number;
  signatureType?: string;
  signatureName?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
