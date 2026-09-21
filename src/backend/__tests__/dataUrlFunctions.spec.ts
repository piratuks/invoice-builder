import type { Bank } from '../shared/types/bank';
import type { Business } from '../shared/types/business';
import type { EntityWithCounts } from '../shared/types/entityWithCounts';
import type { InvoiceBankSnapshots, InvoiceBusinessSnapshots, InvoiceCustomization } from '../shared/types/invoice';
import type { Preset } from '../shared/types/preset';
import type { StyleProfile } from '../shared/types/styleProfiles';
import {
  decodeBank,
  decodeInvoice,
  decodeInvoiceAttachment,
  decodeInvoiceAttachments,
  decodeInvoiceBankSnapshotImport,
  decodeInvoiceBusinessSnapshotImport,
  decodeInvoiceCustomizationImport,
  decodeInvoiceImport,
  decodeLogo,
  decodePreset,
  decodeResultInvoices,
  decodeStyleProfile,
  encodeBank,
  encodeInvoice,
  encodeInvoiceAttachment,
  encodeInvoiceAttachments,
  encodeInvoiceBankSnapshotExport,
  encodeInvoiceBusinessSnapshotExport,
  encodeInvoiceCustomizationExport,
  encodeInvoiceExport,
  encodeLogo,
  encodePreset,
  encodeResultBank,
  encodeResultBusiness,
  encodeResultInvoices,
  encodeResultPreset,
  encodeResultStyleProfile,
  encodeStyleProfile
} from '../shared/utils/dataUrlFunctions';

describe('decodeLogo/encodeLogo', () => {
  it('decodes a base64 logo to a buffer and back', () => {
    const buf = Buffer.from('logo');
    const encoded = encodeLogo({ logo: buf } as unknown as Business & EntityWithCounts);
    expect(encoded?.logo).toBe(buf.toString('base64'));

    const decoded = decodeLogo({ logo: encoded?.logo });
    expect(decoded.logo?.toString()).toBe('logo');
  });

  it('handles null/missing logos', () => {
    expect(encodeLogo(null)).toBeNull();
    expect(encodeLogo({ logo: null } as unknown as Business & EntityWithCounts)?.logo).toBeNull();
    expect(decodeLogo({ logo: null }).logo).toBeNull();
  });
});

describe('encodePreset/decodePreset', () => {
  const preset = {
    signatureData: Buffer.from('sig'),
    businessLogo: Buffer.from('logo'),
    qrCode: Buffer.from('qr'),
    styleProfileWatermarkFileData: Buffer.from('wm'),
    styleProfilePaidWatermarkFileData: Buffer.from('pwm')
  };

  it('encodes and decodes all buffer fields when skip is false', () => {
    const encoded = encodePreset(preset as unknown as Preset);
    expect(encoded?.signatureData).toBe(preset.signatureData.toString('base64'));
    expect(encoded?.businessLogo).toBe(preset.businessLogo.toString('base64'));

    const decoded = decodePreset(encoded!);
    expect(decoded.signatureData?.toString()).toBe('sig');
    expect(decoded.businessLogo?.toString()).toBe('logo');
    expect(decoded.qrCode?.toString()).toBe('qr');
    expect(decoded.styleProfileWatermarkFileData?.toString()).toBe('wm');
    expect(decoded.styleProfilePaidWatermarkFileData?.toString()).toBe('pwm');
  });

  it('skips business/qrCode/watermark fields when skip is true', () => {
    const encoded = encodePreset(preset as unknown as Preset, true);
    expect(encoded?.signatureData).toBe(preset.signatureData.toString('base64'));
    expect(encoded?.businessLogo).toBe(preset.businessLogo);

    const decoded = decodePreset(encoded!, true);
    expect(decoded.qrCode).toBe(preset.qrCode);
    expect(decoded.businessLogo).toBe(preset.businessLogo);
  });

  it('returns falsy input unchanged', () => {
    expect(encodePreset(null)).toBeNull();
    expect(encodePreset(undefined)).toBeUndefined();
  });

  it('handles null buffer fields', () => {
    const encoded = encodePreset({
      signatureData: null,
      businessLogo: null,
      qrCode: null,
      styleProfileWatermarkFileData: null,
      styleProfilePaidWatermarkFileData: null
    } as unknown as Preset);
    expect(encoded?.signatureData).toBeNull();
    expect(encoded?.businessLogo).toBeNull();

    const decoded = decodePreset({
      signatureData: null,
      businessLogo: null,
      qrCode: null,
      styleProfileWatermarkFileData: null,
      styleProfilePaidWatermarkFileData: null
    });
    expect(decoded.signatureData).toBeNull();
    expect(decoded.businessLogo).toBeNull();
  });
});

describe('encodeResultPreset', () => {
  it('encodes an array of presets', () => {
    const result = encodeResultPreset({
      success: true,
      data: [{ signatureData: Buffer.from('a') }] as unknown as Preset[]
    });
    expect((result.data as unknown as Preset[])[0]).toHaveProperty(
      'signatureData',
      Buffer.from('a').toString('base64')
    );
  });

  it('encodes a single preset', () => {
    const result = encodeResultPreset({
      success: true,
      data: { signatureData: Buffer.from('a') } as unknown as Preset
    });
    expect(result.data).toHaveProperty('signatureData', Buffer.from('a').toString('base64'));
  });
});

describe('encodeResultBusiness', () => {
  it('encodes an array and single business result', () => {
    const arrayResult = encodeResultBusiness({
      success: true,
      data: [{ logo: Buffer.from('a') }] as unknown as (Business & EntityWithCounts)[]
    });
    expect((arrayResult.data as unknown as (Business & EntityWithCounts)[])[0]).toHaveProperty(
      'logo',
      Buffer.from('a').toString('base64')
    );

    const singleResult = encodeResultBusiness({
      success: true,
      data: { logo: Buffer.from('a') } as unknown as Business & EntityWithCounts
    });
    expect(singleResult.data).toHaveProperty('logo', Buffer.from('a').toString('base64'));
  });
});

describe('decodeBank/encodeBank/encodeResultBank', () => {
  it('round-trips a bank qrCode', () => {
    const buf = Buffer.from('qr');
    const encoded = encodeBank({ qrCode: buf } as unknown as Bank & EntityWithCounts);
    expect(encoded?.qrCode).toBe(buf.toString('base64'));

    const decoded = decodeBank({ qrCode: encoded?.qrCode });
    expect(decoded.qrCode?.toString()).toBe('qr');
  });

  it('handles null bank input and qrCode', () => {
    expect(encodeBank(null)).toBeNull();
    expect(encodeBank({ qrCode: null } as unknown as Bank & EntityWithCounts)?.qrCode).toBeNull();
    expect(decodeBank({ qrCode: null }).qrCode).toBeNull();
  });

  it('encodes bank results for arrays and single values', () => {
    const arrayResult = encodeResultBank({
      success: true,
      data: [{ qrCode: Buffer.from('a') }] as unknown as (Bank & EntityWithCounts)[]
    });
    expect((arrayResult.data as unknown as (Bank & EntityWithCounts)[])[0]).toHaveProperty(
      'qrCode',
      Buffer.from('a').toString('base64')
    );

    const singleResult = encodeResultBank({
      success: true,
      data: { qrCode: Buffer.from('a') } as unknown as Bank & EntityWithCounts
    });
    expect(singleResult.data).toHaveProperty('qrCode', Buffer.from('a').toString('base64'));
  });
});

describe('decodeStyleProfile/encodeStyleProfile/encodeResultStyleProfile', () => {
  it('round-trips watermark fields', () => {
    const encoded = encodeStyleProfile({
      watermarkFileData: Buffer.from('w'),
      paidWatermarkFileData: Buffer.from('p')
    } as unknown as StyleProfile & EntityWithCounts);
    expect(encoded?.watermarkFileData).toBe(Buffer.from('w').toString('base64'));

    const decoded = decodeStyleProfile(encoded!);
    expect(decoded.watermarkFileData?.toString()).toBe('w');
    expect(decoded.paidWatermarkFileData?.toString()).toBe('p');
  });

  it('handles null style profile input and fields', () => {
    expect(encodeStyleProfile(null)).toBeNull();
    expect(
      encodeStyleProfile({ watermarkFileData: null, paidWatermarkFileData: null } as unknown as StyleProfile &
        EntityWithCounts)?.watermarkFileData
    ).toBeNull();
  });

  it('encodes style profile results for arrays and single values', () => {
    const arrayResult = encodeResultStyleProfile({
      success: true,
      data: [{ watermarkFileData: Buffer.from('a') }] as unknown as (StyleProfile & EntityWithCounts)[]
    });
    expect((arrayResult.data as unknown as (StyleProfile & EntityWithCounts)[])[0]).toHaveProperty(
      'watermarkFileData',
      Buffer.from('a').toString('base64')
    );

    const singleResult = encodeResultStyleProfile({
      success: true,
      data: { watermarkFileData: Buffer.from('a') } as unknown as StyleProfile & EntityWithCounts
    });
    expect(singleResult.data).toHaveProperty('watermarkFileData', Buffer.from('a').toString('base64'));
  });
});

describe('invoice attachment encode/decode', () => {
  it('round-trips a single attachment', () => {
    const encoded = encodeInvoiceAttachment({ data: Buffer.from('file') });
    expect(encoded?.data).toBe(Buffer.from('file').toString('base64'));

    const decoded = decodeInvoiceAttachment({ data: encoded?.data });
    expect(decoded.data?.toString()).toBe('file');
  });

  it('handles null/missing attachments', () => {
    expect(encodeInvoiceAttachment(null)).toBeNull();
    expect(encodeInvoiceAttachment({ data: null })?.data).toBeNull();
    expect(decodeInvoiceAttachment({ data: null }).data).toBeNull();
    expect(encodeInvoiceAttachments(null)).toBeNull();
    expect(decodeInvoiceAttachments(null)).toBeNull();
  });

  it('round-trips a list of attachments', () => {
    const encoded = (encodeInvoiceAttachments([{ data: Buffer.from('a') }]) ?? []) as { data?: unknown }[];
    expect(encoded[0]?.data).toBe(Buffer.from('a').toString('base64'));

    const decoded = decodeInvoiceAttachments(encoded) ?? [];
    expect((decoded[0] as { data?: Buffer })?.data?.toString()).toBe('a');
  });
});

describe('invoice snapshot encode/decode', () => {
  it('round-trips business snapshot logo', () => {
    const encoded = encodeInvoiceBusinessSnapshotExport({
      businessLogo: Buffer.from('logo')
    } as unknown as InvoiceBusinessSnapshots);
    expect(encoded?.businessLogo).toBe(Buffer.from('logo').toString('base64'));
    const decoded = decodeInvoiceBusinessSnapshotImport(encoded as unknown as InvoiceBusinessSnapshots);
    expect(decoded.businessLogo?.toString()).toBe('logo');
  });

  it('handles null business snapshot input', () => {
    expect(encodeInvoiceBusinessSnapshotExport(null)).toBeNull();
    expect(
      encodeInvoiceBusinessSnapshotExport({ businessLogo: null } as unknown as InvoiceBusinessSnapshots)?.businessLogo
    ).toBeNull();
  });

  it('round-trips bank snapshot qrCode', () => {
    const encoded = encodeInvoiceBankSnapshotExport({ qrCode: Buffer.from('qr') } as unknown as InvoiceBankSnapshots);
    expect(encoded?.qrCode).toBe(Buffer.from('qr').toString('base64'));
    const decoded = decodeInvoiceBankSnapshotImport(encoded as unknown as InvoiceBankSnapshots);
    expect(decoded.qrCode?.toString()).toBe('qr');
  });

  it('handles null bank snapshot input', () => {
    expect(encodeInvoiceBankSnapshotExport(null)).toBeNull();
    expect(encodeInvoiceBankSnapshotExport({ qrCode: null } as unknown as InvoiceBankSnapshots)?.qrCode).toBeNull();
  });

  it('round-trips customization watermark fields', () => {
    const encoded = encodeInvoiceCustomizationExport({
      watermarkFileData: Buffer.from('w'),
      paidWatermarkFileData: Buffer.from('p')
    } as unknown as InvoiceCustomization);
    expect(encoded?.watermarkFileData).toBe(Buffer.from('w').toString('base64'));
    const decoded = decodeInvoiceCustomizationImport(encoded as unknown as InvoiceCustomization);
    expect(decoded.watermarkFileData?.toString()).toBe('w');
    expect(decoded.paidWatermarkFileData?.toString()).toBe('p');
  });

  it('handles null customization input', () => {
    expect(encodeInvoiceCustomizationExport(null)).toBeNull();
    expect(
      encodeInvoiceCustomizationExport({
        watermarkFileData: null,
        paidWatermarkFileData: null
      } as unknown as InvoiceCustomization)?.watermarkFileData
    ).toBeNull();
  });
});

describe('encodeInvoiceExport/decodeInvoiceImport', () => {
  it('round-trips invoice signatureData', () => {
    const encoded = encodeInvoiceExport({
      signatureData: Buffer.from('sig')
    } as unknown as import('../shared/types/invoice').Invoice);
    expect(encoded?.signatureData).toBe(Buffer.from('sig').toString('base64'));

    const decoded = decodeInvoiceImport(encoded as unknown as import('../shared/types/invoice').Invoice);
    expect(decoded.signatureData?.toString()).toBe('sig');
  });

  it('handles null invoice input and signature', () => {
    expect(encodeInvoiceExport(null)).toBeNull();
    expect(
      encodeInvoiceExport({ signatureData: null } as unknown as import('../shared/types/invoice').Invoice)
        ?.signatureData
    ).toBeNull();
    expect(
      decodeInvoiceImport({ signatureData: null } as unknown as import('../shared/types/invoice').Invoice).signatureData
    ).toBeNull();
  });
});

describe('encodeInvoice/decodeInvoice', () => {
  it('encodes an invoice with nested snapshots and attachments', () => {
    const invoice = {
      signatureData: Buffer.from('sig'),
      invoiceCustomization: { watermarkFileData: Buffer.from('w') },
      invoiceBusinessSnapshot: { businessLogo: Buffer.from('logo') },
      invoiceBankSnapshot: { qrCode: Buffer.from('qr') },
      invoiceAttachments: [{ data: Buffer.from('a') }]
    };
    const encoded = encodeInvoice(invoice);
    expect(encoded?.signatureData).toBe(Buffer.from('sig').toString('base64'));
    expect((encoded?.invoiceCustomization as { watermarkFileData: string })?.watermarkFileData).toBe(
      Buffer.from('w').toString('base64')
    );

    const decoded = decodeInvoice(encoded!);
    expect((decoded.signatureData as Buffer)?.toString()).toBe('sig');
  });

  it('returns falsy invoice input unchanged for encodeInvoice', () => {
    expect(encodeInvoice(null)).toBeNull();
  });
});

describe('encodeResultInvoices/decodeResultInvoices', () => {
  it('encodes and decodes an array of invoices', () => {
    const invoice = {
      signatureData: Buffer.from('sig'),
      invoiceCustomization: {},
      invoiceBusinessSnapshot: {},
      invoiceBankSnapshot: {}
    };
    const encodedResult = encodeResultInvoices({ success: true, data: [invoice] });
    expect((encodedResult.data as unknown as (typeof invoice)[])[0]).toHaveProperty(
      'signatureData',
      Buffer.from('sig').toString('base64')
    );

    const decodedResult = decodeResultInvoices(
      encodedResult as unknown as import('../shared/types/response').Response<Record<string, unknown>[]>
    );
    expect((decodedResult.data as { signatureData: Buffer }[])[0].signatureData?.toString()).toBe('sig');
  });

  it('encodes and decodes a single invoice', () => {
    const invoice = {
      signatureData: Buffer.from('sig'),
      invoiceCustomization: {},
      invoiceBusinessSnapshot: {},
      invoiceBankSnapshot: {}
    };
    const encodedResult = encodeResultInvoices({ success: true, data: invoice });
    expect(encodedResult.data).toHaveProperty('signatureData', Buffer.from('sig').toString('base64'));

    const decodedResult = decodeResultInvoices(
      encodedResult as unknown as import('../shared/types/response').Response<Record<string, unknown>>
    );
    expect((decodedResult.data as { signatureData: Buffer })?.signatureData?.toString()).toBe('sig');
  });

  it('handles an undefined single invoice result when decoding', () => {
    const result = decodeResultInvoices<Record<string, unknown>>({ success: true, data: undefined });
    expect(result.data).toBeUndefined();
  });
});
