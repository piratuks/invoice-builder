import type { AmountFormat } from '../enums/amountFormat';
import type { DateFormat } from '../enums/dateFormat';
import type { Language } from '../enums/language';

export interface Settings {
  id: number;
  language: Language;
  amountFormat: AmountFormat;
  dateFormat: DateFormat;
  isDarkMode: boolean;
  invoicePrefix?: string;
  invoiceSuffix?: string;
  shouldIncludeYear: boolean;
  shouldIncludeMonth: boolean;
  shouldIncludeBusinessName: boolean;
  quotesON: boolean;
  styleProfilesON: boolean;
  ublON: boolean;
  xrechnungON: boolean;
  presetsON: boolean;
  reportsON: boolean;
  createdAt: string;
  updatedAt: string;
}
