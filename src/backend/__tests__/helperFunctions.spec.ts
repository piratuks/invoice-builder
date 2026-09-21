import { formatDate, formatXml, splitAddress, xmlEscape } from '../shared/utils/einvoice/helperFunctions';

describe('splitAddress', () => {
  it('returns an empty object for missing input', () => {
    expect(splitAddress()).toEqual({});
    expect(splitAddress('')).toEqual({});
  });

  it('extracts street, city, postal code and country', () => {
    const result = splitAddress('123 Main St, Springfield, 12345, US');
    expect(result.street).toBe('123 Main St');
    expect(result.city).toBe('Springfield');
    expect(result.postalZone).toBe('12345');
    expect(result.country).toBe('US');
  });

  it('handles addresses without a recognizable street or postal code', () => {
    const result = splitAddress('Springfield, US');
    expect(result.city).toBe('Springfield');
    expect(result.country).toBe('US');
    expect(result.street).toBeUndefined();
  });

  it('derives a 2-letter country code from a 3-letter country', () => {
    const result = splitAddress('Springfield, USA');
    expect(result.country).toBe('USA');
  });
});

describe('xmlEscape', () => {
  it('escapes reserved XML characters', () => {
    expect(xmlEscape(`<tag> & 'quote' "double"`)).toBe(`&lt;tag&gt; &amp; &apos;quote&apos; "double"`);
  });

  it('returns an empty string for null/undefined', () => {
    expect(xmlEscape(undefined)).toBe('');
    expect(xmlEscape(null)).toBe('');
  });

  it('stringifies numbers and booleans', () => {
    expect(xmlEscape(42)).toBe('42');
    expect(xmlEscape(true)).toBe('true');
  });
});

describe('formatDate (einvoice)', () => {
  it('formats a valid date string', () => {
    expect(formatDate('2024-01-15', 'yyyy-MM-dd' as never)).toBe('2024-01-15');
  });

  it('returns an empty string for falsy or invalid input', () => {
    expect(formatDate('', 'yyyy-MM-dd' as never)).toBe('');
    expect(formatDate('not-a-date', 'yyyy-MM-dd' as never)).toBe('');
  });
});

describe('formatXml', () => {
  it('indents nested elements', () => {
    const result = formatXml('<root><child>value</child></root>');
    expect(result).toBe('<root>\n  <child>value</child>\n</root>');
  });

  it('handles self-closing tags and declarations without extra indentation', () => {
    const result = formatXml('<?xml version="1.0"?><root><self/></root>');
    expect(result.split('\n')[0]).toBe('<?xml version="1.0"?>');
    expect(result).toContain('<self/>');
  });
});
