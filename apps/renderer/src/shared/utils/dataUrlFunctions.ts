import type { TFunction } from 'i18next';

export const toDataUrl = (input: Blob | Uint8Array, mimeType: string = 'image/png'): Promise<string> => {
  mimeType = mimeType ?? 'image/png';

  const blob = input instanceof Blob ? input : new Blob([new Uint8Array(input).buffer], { type: mimeType });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to convert to DataURL'));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const isDataUrl = (value: unknown): value is string => {
  return typeof value === 'string' && /^data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+$/.test(value);
};

export const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const toUint8Array = async (
  t: TFunction<'translation', undefined>,
  input: Blob | File | ArrayBuffer | Uint8Array | null
) => {
  if (!input) return null;

  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (input instanceof Blob) {
    const arrayBuffer = await input.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  throw new Error(t('error.unsupportedImage'));
};
