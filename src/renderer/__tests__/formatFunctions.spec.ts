import { AmountFormat } from '../shared/enums/amountFormat';
import { CurrencyFormat } from '../shared/enums/currencyFormat';
import {
  createCurrencyFormatter,
  formatAmount,
  formatDate,
  getFormattedCurrency,
  getFormattedLabel,
  getFormattingMeta,
  supportsCurrencySubunit,
  toUTCISOString
} from '../shared/utils/formatFunctions';

describe('toUTCISOString', () => {
  it('converts a local date to a UTC ISO string using local field values', () => {
    const date = new Date(2024, 0, 15, 10, 30, 0, 0);
    const result = toUTCISOString(date);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO string using the given pattern', () => {
    expect(formatDate('2024-01-15', 'MM/dd/yyyy' as never)).toBe('01/15/2024');
  });

  it('formats a Date instance', () => {
    expect(formatDate(new Date(2024, 0, 15), 'MM/dd/yyyy' as never)).toBe('01/15/2024');
  });

  it('returns an empty string for falsy or invalid input', () => {
    expect(formatDate('', 'MM/dd/yyyy' as never)).toBe('');
    expect(formatDate('not-a-date', 'MM/dd/yyyy' as never)).toBe('');
  });
});

describe('getFormattedLabel', () => {
  it('replaces symbol and code placeholders', () => {
    expect(getFormattedLabel({ label: '{symbol}{code}', symbol: '$', code: 'USD' })).toBe('$USD');
  });

  it('handles missing symbol/code gracefully', () => {
    expect(getFormattedLabel({ label: '{symbol}{code}', symbol: '', code: '' })).toBe('');
  });
});

describe('getFormattingMeta', () => {
  it('returns decimal/thousand separators per locale', () => {
    expect(getFormattingMeta(AmountFormat.enUS)).toEqual({
      hasDecimal: true,
      thousand: ',',
      decimal: '.',
      baseLocale: 'en-US'
    });
    expect(getFormattingMeta(AmountFormat.ltLT)).toEqual({
      hasDecimal: true,
      thousand: ' ',
      decimal: ',',
      baseLocale: 'lt-LT'
    });
    expect(getFormattingMeta(AmountFormat.deDE)).toEqual({
      hasDecimal: true,
      thousand: '.',
      decimal: ',',
      baseLocale: 'de-DE'
    });
  });

  it('disables decimals for no-decimal formats', () => {
    expect(getFormattingMeta(AmountFormat.enUSnodecimal).hasDecimal).toBe(false);
  });

  it('falls back to default separators for unknown locales', () => {
    expect(getFormattingMeta('fr-FR' as AmountFormat)).toEqual({
      hasDecimal: true,
      thousand: ',',
      decimal: '.',
      baseLocale: 'fr-FR'
    });
  });

  it('uses the default amountFormat argument when omitted', () => {
    expect(getFormattingMeta().baseLocale).toBe('en-US');
  });
});

describe('formatAmount', () => {
  it('formats with 2 decimal places by default', () => {
    expect(formatAmount(1234.5, AmountFormat.enUS)).toBe('1,234.50');
  });

  it('formats without decimals when requested', () => {
    expect(formatAmount(1234.5, AmountFormat.enUSnodecimal)).toBe('1,235');
  });
});

describe('getFormattedCurrency', () => {
  it('combines symbol/code and formatted amount', () => {
    const result = getFormattedCurrency({
      amount: 1000,
      amountFormat: AmountFormat.enUS,
      format: CurrencyFormat.symbolAmount,
      symbol: '$',
      code: 'USD'
    });
    expect(result).toBe('$1,000.00');
  });
});

describe('supportsCurrencySubunit', () => {
  it('returns false when settings are missing', () => {
    expect(supportsCurrencySubunit(undefined, {} as never)).toBe(false);
  });

  it('returns false when invoice snapshot fields are missing', () => {
    expect(supportsCurrencySubunit({} as never, {} as never)).toBe(false);
  });

  it('returns true when all required fields are present', () => {
    const invoiceForm = {
      currencyFormat: CurrencyFormat.symbolAmount,
      invoiceCurrencySnapshot: { currencySymbol: '$', currencyCode: 'USD', currencySubunit: 100 }
    } as never;
    expect(supportsCurrencySubunit({} as never, invoiceForm)).toBe(true);
  });
});

describe('createCurrencyFormatter', () => {
  it('formats using invoice currency snapshot when supported', () => {
    const storeSettings = { amountFormat: AmountFormat.enUS } as never;
    const invoiceForm = {
      currencyFormat: CurrencyFormat.symbolAmount,
      invoiceCurrencySnapshot: { currencySymbol: '$', currencyCode: 'USD', currencySubunit: 100 }
    } as never;
    const formatter = createCurrencyFormatter(storeSettings, invoiceForm);
    expect(formatter(1000)).toBe('$1,000.00');
  });

  it('falls back to plain amount formatting when unsupported', () => {
    const storeSettings = { amountFormat: AmountFormat.enUS } as never;
    const invoiceForm = {} as never;
    const formatter = createCurrencyFormatter(storeSettings, invoiceForm);
    expect(formatter(1000)).toBe('1,000.00');
  });
});
