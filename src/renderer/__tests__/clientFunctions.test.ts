import { describe, expect, it } from 'vitest';
import { generateClientShortName } from '../shared/utils/clientFunctions';

describe('generateClientShortName', () => {
  it('uses initials from first two words', () => {
    expect(generateClientShortName('John Doe')).toBe('JD');
    expect(generateClientShortName('  Acme   Corp  ')).toBe('AC');
  });

  it('uses first two letters for a single word', () => {
    expect(generateClientShortName('Acme')).toBe('AC');
    expect(generateClientShortName('beta')).toBe('BE');
  });

  it('pads single-character names to two characters', () => {
    expect(generateClientShortName('A')).toBe('AX');
  });

  it('handles empty input with a fallback', () => {
    expect(generateClientShortName('')).toBe('XX');
    expect(generateClientShortName('   ')).toBe('XX');
  });

  it('handles unicode names', () => {
    expect(generateClientShortName('José García')).toBe('JG');
    expect(generateClientShortName('Über')).toBe('ÜB');
  });
});
