import { AmountFormat } from '../shared/enums/amountFormat';
import { CurrencyFormat } from '../shared/enums/currencyFormat';
import { DateFormat } from '../shared/enums/dateFormat';
import { Language } from '../shared/enums/language';

export const LANGUAGE_ITEMS = {
  [Language.lt]: { label: 'Lithuanian', value: Language.lt },
  [Language.en]: { label: 'English', value: Language.en },
  [Language.fr]: { label: 'French', value: Language.fr },
  [Language.de]: { label: 'German', value: Language.de },
  [Language.pt]: { label: 'Portuguese', value: Language.pt }
} as const;

export const LANGUAGE_ITEMS_ARRAY = Object.values(LANGUAGE_ITEMS);

export const AMOUNT_FORMAT_ITEMS = {
  [AmountFormat.enUS]: { label: '1,234.10', value: AmountFormat.enUS },
  [AmountFormat.enUSnodecimal]: { label: '1,234', value: AmountFormat.enUSnodecimal },
  [AmountFormat.ltLT]: { label: '1 234,10', value: AmountFormat.ltLT },
  [AmountFormat.ltLTnodecimal]: { label: '1 234', value: AmountFormat.ltLTnodecimal },
  [AmountFormat.deDE]: { label: '1.234,10', value: AmountFormat.deDE },
  [AmountFormat.deDEnodecimal]: { label: '1.234', value: AmountFormat.deDEnodecimal }
} as const;

export const AMOUNT_FORMAT_ITEMS_ARRAY = Object.values(AMOUNT_FORMAT_ITEMS);

export const DATE_FORMAT_ITEMS = {
  [DateFormat.MMddyyyy]: { label: '11/11/2025 (MM.dd.yyyy)', value: DateFormat.MMddyyyy },
  [DateFormat.ddMMyyyy]: { label: '11/11/2025 (dd.MM.yyyy)', value: DateFormat.ddMMyyyy },
  [DateFormat.yyyyMMdd]: { label: '2025/11/11 (yyyy.MM.dd)', value: DateFormat.yyyyMMdd },
  [DateFormat.MMddyyyyDash]: { label: '11-11-2025 (MM-dd-yyyy)', value: DateFormat.MMddyyyyDash },
  [DateFormat.ddMMyyyyDash]: { label: '11-11-2025 (dd-MM-yyyy)', value: DateFormat.ddMMyyyyDash },
  [DateFormat.yyyyMMddDash]: { label: '2025-11-11 (yyyy-MM-dd)', value: DateFormat.yyyyMMddDash },
  [DateFormat.MMddyyyyDot]: { label: '11.11.2025 (MM.dd.yyyy)', value: DateFormat.MMddyyyyDot },
  [DateFormat.ddMMyyyyDot]: { label: '11.11.2025 (dd.MM.yyyy)', value: DateFormat.ddMMyyyyDot },
  [DateFormat.yyyyMMddDot]: { label: '2025.11.2025 (yyyy.MM.dd)', value: DateFormat.yyyyMMddDot },
  [DateFormat.MMMdyyyy]: { label: 'Nov 11, 2025 (MMM d, yyyy)', value: DateFormat.MMMdyyyy },
  [DateFormat.dMMMMyyyy]: { label: '11 Nov 2025 (d MMMM yyyy)', value: DateFormat.dMMMMyyyy },
  [DateFormat.yyyyMMMdd]: { label: '2025 Nov 11 (yyyy MMM dd)', value: DateFormat.yyyyMMMdd }
} as const;

export const DATE_FORMAT_ITEMS_ARRAY = Object.values(DATE_FORMAT_ITEMS);

export const CURRENCY_FORMAT_ITEMS = {
  [CurrencyFormat.symbolAmount]: { label: '{symbol}123', value: CurrencyFormat.symbolAmount },
  [CurrencyFormat.symbolSpaceAmount]: { label: '{symbol} 123', value: CurrencyFormat.symbolSpaceAmount },
  [CurrencyFormat.amountSymbol]: { label: '123{symbol}', value: CurrencyFormat.amountSymbol },
  [CurrencyFormat.amountSpaceSymbol]: { label: '123 {symbol}', value: CurrencyFormat.amountSpaceSymbol },
  [CurrencyFormat.codeAmount]: { label: '{code}123', value: CurrencyFormat.codeAmount },
  [CurrencyFormat.codeSpaceAmount]: { label: '{code} 123', value: CurrencyFormat.codeSpaceAmount },
  [CurrencyFormat.amountCode]: { label: '123{code}', value: CurrencyFormat.amountCode },
  [CurrencyFormat.amountSpaceCode]: { label: '123 {code}', value: CurrencyFormat.amountSpaceCode },
  [CurrencyFormat.amountOnly]: { label: '123', value: CurrencyFormat.amountOnly }
} as const;

export const CURRENCY_FORMAT_ITEMS_ARRAY = Object.values(CURRENCY_FORMAT_ITEMS);

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const DEFAULT_TABLE_FIELD_SORT_ORDERS = {
  no: 0,
  item: 1,
  unit: 2,
  quantity: 3,
  unitCost: 4,
  total: 5
};

export const FONT_ITEMS_ARRAY = [
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times-Roman', value: 'Times-Roman' },
  { label: 'Courier', value: 'Courier' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Inter', value: 'Inter' }
];
