import { fromBase64 } from '../shared/utils/generalFunctions';

describe('fromBase64', () => {
  it('decodes a base64 string into a Buffer', () => {
    const result = fromBase64(Buffer.from('hello').toString('base64'));
    expect(result?.toString()).toBe('hello');
  });

  it('returns null for non-string input', () => {
    expect(fromBase64(undefined)).toBeNull();
    expect(fromBase64(null)).toBeNull();
    expect(fromBase64(42)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(fromBase64('')).toBeNull();
  });
});
