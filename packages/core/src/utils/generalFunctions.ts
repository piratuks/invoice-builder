export const fromBase64 = (value: unknown): Buffer | null => {
  if (!value || typeof value !== 'string') return null;
  try {
    return Buffer.from(value, 'base64');
  } catch {
    return null;
  }
};
