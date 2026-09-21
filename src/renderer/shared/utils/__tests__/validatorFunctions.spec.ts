import { validateOnlyNumbersLetters, validators } from '../validatorFunctions';

describe('validators.email', () => {
  it('accepts valid emails and rejects invalid ones', () => {
    expect(validators.email('test@example.com')).toBe(true);
    expect(validators.email('not-an-email')).toBe(false);
    expect(validators.email('missing@domain')).toBe(false);
  });
});

describe('validators.phone', () => {
  it('accepts valid phone numbers and rejects invalid ones', () => {
    expect(validators.phone('+1234567')).toBe(true);
    expect(validators.phone('(+44) 20 1234 5678')).toBe(true);
    expect(validators.phone('not-a-phone')).toBe(false);
  });
});

describe('validators.required', () => {
  it('rejects blank/whitespace strings', () => {
    expect(validators.required('value')).toBe(true);
    expect(validators.required('   ')).toBe(false);
    expect(validators.required('')).toBe(false);
  });
});

describe('validators.sortCode', () => {
  it('validates 6-digit sort codes with optional separators', () => {
    expect(validators.sortCode('12-34-56')).toBe(true);
    expect(validators.sortCode('123456')).toBe(true);
    expect(validators.sortCode('12345')).toBe(false);
    expect(validators.sortCode('')).toBe(false);
  });
});

describe('validators.accountNumber', () => {
  it('validates alphanumeric account numbers', () => {
    expect(validators.accountNumber('AB12 3456')).toBe(true);
    expect(validators.accountNumber('AB')).toBe(false);
    expect(validators.accountNumber('')).toBe(false);
  });
});

describe('validators.swift', () => {
  it('validates 8 or 11 character SWIFT codes', () => {
    expect(validators.swift('ABCDEFGH')).toBe(true);
    expect(validators.swift('ABCDEFGHXXX')).toBe(true);
    expect(validators.swift('ABC')).toBe(false);
  });
});

describe('validators.routingNumber', () => {
  it('validates 9-digit routing numbers', () => {
    expect(validators.routingNumber('123456789')).toBe(true);
    expect(validators.routingNumber('12345')).toBe(false);
  });
});

describe('validators.branchCode', () => {
  it('allows empty string or 3-6 digit codes', () => {
    expect(validators.branchCode('')).toBe(true);
    expect(validators.branchCode('123')).toBe(true);
    expect(validators.branchCode('123456')).toBe(true);
    expect(validators.branchCode('12')).toBe(false);
  });
});

describe('validators.upiOrPix', () => {
  it('accepts UPI, email, phone, CPF and UUID formats', () => {
    expect(validators.upiOrPix('user@upi')).toBe(true);
    expect(validators.upiOrPix('test@example.com')).toBe(true);
    expect(validators.upiOrPix('+12345678')).toBe(true);
    expect(validators.upiOrPix('12345678901')).toBe(true);
    expect(validators.upiOrPix('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(validators.upiOrPix('')).toBe(false);
    expect(validators.upiOrPix('!!invalid!!')).toBe(false);
  });
});

describe('validators.countryCode', () => {
  it('validates ISO 3166-1 alpha-2 codes', () => {
    expect(validators.countryCode('us')).toBe(true);
    expect(validators.countryCode('USA')).toBe(false);
    expect(validators.countryCode('')).toBe(false);
  });
});

describe('validators.peppolEndpointId', () => {
  it('validates alphanumeric peppol endpoint ids', () => {
    expect(validators.peppolEndpointId('0088:1234')).toBe(false);
    expect(validators.peppolEndpointId('endpoint-id.123')).toBe(true);
    expect(validators.peppolEndpointId('')).toBe(false);
  });
});

describe('validators.peppolEndpointSchemeId', () => {
  it('validates alphanumeric scheme ids', () => {
    expect(validators.peppolEndpointSchemeId('0088')).toBe(true);
    expect(validators.peppolEndpointSchemeId('')).toBe(false);
    expect(validators.peppolEndpointSchemeId('id-with-dash')).toBe(false);
  });
});

describe('validateOnlyNumbersLetters', () => {
  it('validates alphanumeric-only strings', () => {
    expect(validateOnlyNumbersLetters('abc123')).toBe(true);
    expect(validateOnlyNumbersLetters('')).toBe(true);
    expect(validateOnlyNumbersLetters('abc-123')).toBe(false);
  });
});
