import { base64ToBytes, isDataUrl, toDataUrl, toUint8Array } from '../dataUrlFunctions';

const t = ((key: string) => key) as never;

describe('toDataUrl', () => {
  it('converts a Blob to a data URL', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const result = await toDataUrl(blob);
    expect(result).toMatch(/^data:/);
  });

  it('converts a Uint8Array to a data URL using the given mime type', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const result = await toDataUrl(bytes, 'image/png');
    expect(result).toMatch(/^data:image\/png/);
  });
});

describe('isDataUrl', () => {
  it('recognizes valid base64 data URLs', () => {
    expect(isDataUrl('data:image/png;base64,aGVsbG8=')).toBe(true);
  });

  it('rejects non-data-url strings and non-strings', () => {
    expect(isDataUrl('not-a-data-url')).toBe(false);
    expect(isDataUrl(42)).toBe(false);
    expect(isDataUrl(null)).toBe(false);
  });
});

describe('base64ToBytes', () => {
  it('decodes a base64 string into bytes', () => {
    const base64 = btoa('hello');
    const bytes = base64ToBytes(base64);
    expect(Buffer.from(bytes).toString()).toBe('hello');
  });
});

describe('toUint8Array', () => {
  it('returns null for falsy input', async () => {
    expect(await toUint8Array(t, null)).toBeNull();
  });

  it('passes through a Uint8Array', async () => {
    const input = new Uint8Array([1, 2]);
    expect(await toUint8Array(t, input)).toBe(input);
  });

  it('converts an ArrayBuffer', async () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer;
    const result = await toUint8Array(t, buffer);
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('converts a Blob', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])]);
    const result = await toUint8Array(t, blob);
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('throws for unsupported input types', async () => {
    await expect(toUint8Array(t, 'unsupported' as never)).rejects.toThrow('error.unsupportedImage');
  });
});
