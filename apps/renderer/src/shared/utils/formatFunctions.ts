import type { InvoiceFromData } from '../types/formData';
import { format, parseISO } from 'date-fns';
import type { DateFormat, Settings } from '@invoice-builder/contracts';
import { AmountFormat } from '@invoice-builder/contracts';
import { CurrencyFormat } from '../enums/currencyFormat';

export const toUTCISOString = (date: Date) =>
  new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    )
  ).toISOString();

export const formatDate = (date: string | Date, pattern: DateFormat) => {
  if (!date) return '';

  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isNaN(d.getTime())) return '';

  return format(d, pattern);
};

export const getFormattedLabel = (data: { label: string; symbol: string; code: string }) => {
  return data.label.replace('{symbol}', data.symbol || '').replace('{code}', data.code || '');
};

export const getFormattedCurrency = (data: {
  amount: number;
  amountFormat: AmountFormat;
  format: CurrencyFormat;
  symbol: string;
  code: string;
}) => {
  const formattedAmount = formatAmount(data.amount, data.amountFormat);
  return data.format.replace('{symbol}', data.symbol).replace('{code}', data.code).replace('{amount}', formattedAmount);
};

export const getFormattingMeta = (amountFormat: AmountFormat = AmountFormat.enUS) => {
  const hasDecimal = !amountFormat.includes('no-decimal');
  const separatorMap: Record<string, { thousand: string; decimal: string }> = {
    'en-US': { thousand: ',', decimal: '.' },
    'lt-LT': { thousand: ' ', decimal: ',' },
    'de-DE': { thousand: '.', decimal: ',' }
  };
  const baseLocale = amountFormat.replace('-no-decimal', '');
  const { thousand, decimal } = separatorMap[baseLocale] || { thousand: ',', decimal: '.' };

  return { hasDecimal, thousand, decimal, baseLocale };
};

export const formatAmount = (amount: number, amountFormat: AmountFormat = AmountFormat.enUS) => {
  const { hasDecimal, baseLocale } = getFormattingMeta(amountFormat);

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: hasDecimal ? 2 : 0,
    useGrouping: true
  };

  return new Intl.NumberFormat(baseLocale, options).format(amount);
};

export const supportsCurrencySubunit = (storeSettings?: Settings, invoiceForm?: InvoiceFromData) =>
  Boolean(
    storeSettings &&
    invoiceForm?.invoiceCurrencySnapshot?.currencySymbol !== undefined &&
    invoiceForm?.invoiceCurrencySnapshot?.currencyCode !== undefined &&
    invoiceForm?.invoiceCurrencySnapshot?.currencySubunit !== undefined &&
    invoiceForm?.currencyFormat !== undefined
  );

export const createCurrencyFormatter = (storeSettings: Settings, invoiceForm: InvoiceFromData) => {
  const supports = supportsCurrencySubunit(storeSettings, invoiceForm);

  return (amount: number) =>
    supports
      ? getFormattedCurrency({
          amount,
          amountFormat: storeSettings.amountFormat,
          format: invoiceForm.currencyFormat as CurrencyFormat,
          symbol: invoiceForm.invoiceCurrencySnapshot!.currencySymbol!,
          code: invoiceForm.invoiceCurrencySnapshot!.currencyCode!
        })
      : formatAmount(amount, storeSettings.amountFormat);
};
