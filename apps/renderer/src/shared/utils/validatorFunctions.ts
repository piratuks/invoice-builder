export const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v: string) => /^(\+\d{1,3}|\(\+\d{1,3}\))\s*\d{4,14}$/.test(v.replace(/\s+/g, '')),
  required: (v: string) => v.trim() !== '',
  sortCode: (v: string) => {
    if (!v) return false;

    const cleaned = v.replace(/[\s-]/g, '');

    return /^\d{6}$/.test(cleaned);
  },
  accountNumber: (v: string) => {
    if (!v) return false;

    const cleaned = v.replace(/\s+/g, '');

    return /^[A-Z0-9\\-]{4,34}$/i.test(cleaned);
  },
  swift: (v: string) => /^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(v.toUpperCase()),
  routingNumber: (v: string) => /^\d{9}$/.test(v),
  branchCode: (v: string) => v === '' || /^\d{3,6}$/.test(v),
  upiOrPix: (v: string) => {
    if (!v) return false;

    const upi = /^[a-zA-Z0-9._]+@[a-zA-Z0-9]+$/.test(v);
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const phone = /^\+[1-9]\d{6,14}$/.test(v);
    const cpf = /^\d{11}$/.test(v);
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

    return upi || email || phone || cpf || uuid;
  },
  countryCode: (v: string) => {
    if (!v) return false;
    // ISO 3166-1 alpha-2 code: exactly 2 uppercase letters
    return /^[A-Z]{2}$/.test(v.toUpperCase());
  },
  // PEPPOL-specific validators
  peppolEndpointId: (v: string) => {
    if (!v) return false;
    // Typically alphanumeric, dots, dashes, max 256 chars
    return /^[a-zA-Z0-9.-]{1,256}$/.test(v);
  },
  peppolEndpointSchemeId: (v: string) => {
    if (!v) return false;
    // Usually numeric or alphabetic identifier for the scheme
    return /^[a-zA-Z0-9]{1,20}$/.test(v);
  }
} as const;

export const validateOnlyNumbersLetters = (value: string) => {
  const isValid = /^[a-zA-Z0-9]*$/.test(value);
  return isValid;
};
