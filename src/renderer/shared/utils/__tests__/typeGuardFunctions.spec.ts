import {
  isBankFromData,
  isBusinessFromData,
  isCategoryFromData,
  isClientFromData,
  isCurrencyFromData,
  isInvoiceBankSnapshotFromData,
  isInvoiceBusinessSnapshotFromData,
  isInvoiceClientSnapshotFromData,
  isInvoiceCurrencySnapshotFromData,
  isInvoiceCustomizationFromData,
  isInvoiceFromData,
  isItemFromData,
  isLayoutData,
  isLayoutFormData,
  isPresetFromData,
  isStyleProfileFromData,
  isUnitFromData
} from '../typeGuardFunctions';

type Guard = (data: unknown) => boolean;

const expectFieldRejections = (guard: Guard, valid: Record<string, unknown>, cases: Array<[string, unknown]>) => {
  for (const [field, bad] of cases) {
    expect(guard({ ...valid, [field]: bad })).toBe(false);
  }
};

const NON_OBJECTS: unknown[] = [null, undefined, 'string', 42, true, []];
const NON_OBJECTS_NO_ARRAY: unknown[] = [null, undefined, 'string', 42, true];

describe('isLayoutFormData', () => {
  it('rejects non-objects', () => {
    for (const value of NON_OBJECTS) expect(isLayoutFormData(value)).toBe(false);
  });

  it('rejects invalid id/isArchived/schema types', () => {
    expect(isLayoutFormData({ isArchived: true, schema: '{}' })).toBe(false);
    expect(isLayoutFormData({ id: 'x', isArchived: true, schema: '{}' })).toBe(false);
    expect(isLayoutFormData({ isArchived: 'x', schema: '{}' })).toBe(false);
    expect(isLayoutFormData({ isArchived: true, schema: 123 })).toBe(false);
  });

  it('rejects schema strings that fail validation', () => {
    expect(isLayoutFormData({ isArchived: true, schema: JSON.stringify({ schemaVersion: 3 }) })).toBe(false);
  });

  it('accepts a valid stringified v1 layout schema', () => {
    const schema = JSON.stringify({ schemaVersion: 1, meta: { name: 'Receipt layout' }, sections: [] });
    expect(isLayoutFormData({ id: 1, isArchived: false, schema })).toBe(true);
  });
});

describe('isLayoutData', () => {
  it('rejects non-objects and invalid fields', () => {
    for (const value of NON_OBJECTS) expect(isLayoutData(value)).toBe(false);
    expect(isLayoutData({ isArchived: true, schema: 'not-a-record' })).toBe(false);
    expect(isLayoutData({ id: 'x', isArchived: true, schema: {} })).toBe(false);
    expect(isLayoutData({ isArchived: 'x', schema: {} })).toBe(false);
  });

  it('accepts a valid v1 schema object', () => {
    const schema = { schemaVersion: 1 as const, meta: { name: 'Receipt layout' }, sections: [] };
    expect(isLayoutData({ id: 1, isArchived: false, schema })).toBe(true);
  });

  it('rejects an invalid v2 schema object', () => {
    expect(isLayoutData({ isArchived: false, schema: { schemaVersion: 2 } })).toBe(false);
  });
});

describe('isBankFromData', () => {
  const valid = { name: 'Bank A' };

  it('rejects non-objects and missing name', () => {
    for (const value of NON_OBJECTS) expect(isBankFromData(value)).toBe(false);
    expect(isBankFromData({})).toBe(false);
  });

  it('accepts a minimal valid bank', () => {
    expect(isBankFromData(valid)).toBe(true);
  });

  it('accepts a fully populated valid bank', () => {
    expect(
      isBankFromData({
        ...valid,
        id: 1,
        isArchived: false,
        qrCode: new Uint8Array([1, 2]),
        bankName: 'Chase',
        accountNumber: '12345',
        swiftCode: 'ABCDEF12',
        address: '123 Street',
        branchCode: '001',
        routingNumber: '123456789',
        sortOrder: '1',
        accountHolder: 'John Doe',
        type: 'checking',
        upiCode: 'foo@bank',
        qrCodeFileType: 'image/png',
        qrCodeFileName: 'qr.png',
        qrCodeFileSize: 100
      })
    ).toBe(true);
  });

  it('rejects invalid field types', () => {
    expectFieldRejections(isBankFromData, valid, [
      ['id', 'x'],
      ['isArchived', 'x'],
      ['qrCode', 'not-a-blob'],
      ['bankName', 123],
      ['accountNumber', 123],
      ['swiftCode', 123],
      ['address', 123],
      ['branchCode', 123],
      ['routingNumber', 123],
      ['sortOrder', 123],
      ['accountHolder', 123],
      ['type', 123],
      ['upiCode', 123],
      ['qrCodeFileType', 123],
      ['qrCodeFileName', 123],
      ['qrCodeFileSize', 'x']
    ]);
  });
});

describe('isPresetFromData', () => {
  const valid = { name: 'Preset A' };

  it('rejects non-objects and missing name', () => {
    for (const value of NON_OBJECTS) expect(isPresetFromData(value)).toBe(false);
    expect(isPresetFromData({})).toBe(false);
  });

  it('accepts a minimal valid preset', () => {
    expect(isPresetFromData(valid)).toBe(true);
  });

  it('accepts a fully populated valid preset', () => {
    expect(
      isPresetFromData({
        ...valid,
        id: 1,
        isArchived: false,
        signatureData: new Uint8Array([1]),
        businessId: 1,
        clientId: 2,
        language: 'en',
        currencyId: 3,
        bankId: 4,
        styleProfilesId: 5,
        customerNotes: 'note',
        thanksNotes: 'thanks',
        termsConditionNotes: 'terms',
        signatureSize: 10,
        signatureType: 'image/png',
        signatureName: 'sig.png'
      })
    ).toBe(true);
  });

  it('rejects invalid field types', () => {
    expectFieldRejections(isPresetFromData, valid, [
      ['id', 'x'],
      ['isArchived', 'x'],
      ['signatureData', 'not-a-blob'],
      ['businessId', 'x'],
      ['clientId', 'x'],
      ['language', 1],
      ['currencyId', 'x'],
      ['bankId', 'x'],
      ['styleProfilesId', 'x'],
      ['customerNotes', 1],
      ['thanksNotes', 1],
      ['termsConditionNotes', 1],
      ['signatureSize', 'x'],
      ['signatureType', 1],
      ['signatureName', 1]
    ]);
  });
});

describe('isStyleProfileFromData', () => {
  const valid = { name: 'Profile A' };

  it('rejects non-objects and missing name', () => {
    for (const value of NON_OBJECTS) expect(isStyleProfileFromData(value)).toBe(false);
    expect(isStyleProfileFromData({})).toBe(false);
  });

  it('accepts a minimal valid style profile', () => {
    expect(isStyleProfileFromData(valid)).toBe(true);
  });

  it('accepts a fully populated valid style profile', () => {
    expect(
      isStyleProfileFromData({
        ...valid,
        pdfTexts: { billTo: 'Bill To' },
        fieldSortOrders: { no: 0, item: 1, unit: 2, quantity: 3, unitCost: 4, total: 5 },
        id: 1,
        isArchived: false,
        labelUpperCase: true,
        showQuantity: true,
        showUnit: true,
        showRowNo: true,
        watermarkFileData: new Uint8Array([1]),
        paidWatermarkFileData: new Uint8Array([1]),
        color: '#fff',
        watermarkFileName: 'w.png',
        watermarkFileType: 'image/png',
        paidWatermarkFileName: 'p.png',
        paidWatermarkFileType: 'image/png',
        watermarkFileSize: 10,
        paidWatermarkFileSize: 10,
        logoSize: 'medium',
        fontSize: 'medium',
        fontFamily: 'Roboto',
        layout: 'classic',
        tableHeaderStyle: 'light',
        tableRowStyle: 'classic',
        pageFormat: 'A4'
      })
    ).toBe(true);
  });

  it('rejects invalid pdfTexts/fieldSortOrders', () => {
    expect(isStyleProfileFromData({ ...valid, pdfTexts: { unknownKey: 'x' } })).toBe(false);
    expect(isStyleProfileFromData({ ...valid, fieldSortOrders: { no: 'x' } })).toBe(false);
  });

  it('rejects invalid field types', () => {
    expectFieldRejections(isStyleProfileFromData, valid, [
      ['id', 'x'],
      ['isArchived', 'x'],
      ['labelUpperCase', 'x'],
      ['showQuantity', 'x'],
      ['showUnit', 'x'],
      ['showRowNo', 'x'],
      ['watermarkFileData', 'not-a-blob'],
      ['paidWatermarkFileData', 'not-a-blob'],
      ['color', 1],
      ['watermarkFileName', 1],
      ['watermarkFileType', 1],
      ['paidWatermarkFileName', 1],
      ['paidWatermarkFileType', 1],
      ['watermarkFileSize', 'x'],
      ['paidWatermarkFileSize', 'x'],
      ['logoSize', 'huge'],
      ['fontSize', 'huge'],
      ['fontFamily', 'Comic Sans'],
      ['layout', 'weird'],
      ['tableHeaderStyle', 'weird'],
      ['tableRowStyle', 'weird'],
      ['pageFormat', 'A5']
    ]);
  });
});

describe('isBusinessFromData', () => {
  const valid = { name: 'Biz A', shortName: 'BA' };

  it('rejects non-objects and missing required fields', () => {
    for (const value of NON_OBJECTS) expect(isBusinessFromData(value)).toBe(false);
    expect(isBusinessFromData({ name: 'Biz A' })).toBe(false);
    expect(isBusinessFromData({ shortName: 'BA' })).toBe(false);
  });

  it('accepts a minimal valid business', () => {
    expect(isBusinessFromData(valid)).toBe(true);
  });

  it('accepts a fully populated valid business', () => {
    expect(
      isBusinessFromData({
        ...valid,
        id: 1,
        isArchived: false,
        logo: new Uint8Array([1]),
        email: 'test@example.com',
        phone: '+1234567890',
        description: 'desc',
        peppolEndpointId: 'id',
        countryCode: 'US',
        peppolEndpointSchemeId: '0088',
        code: 'C1',
        role: 'Owner',
        address: '123 st',
        website: 'https://example.com',
        additional: 'more',
        vatCode: 'VAT1',
        paymentInformation: 'info'
      })
    ).toBe(true);
  });

  it('rejects invalid email/phone formats', () => {
    expect(isBusinessFromData({ ...valid, email: 'not-an-email' })).toBe(false);
    expect(isBusinessFromData({ ...valid, phone: 'not-a-phone' })).toBe(false);
  });

  it('rejects invalid field types', () => {
    expectFieldRejections(isBusinessFromData, valid, [
      ['id', 'x'],
      ['isArchived', 'x'],
      ['logo', 'not-a-blob'],
      ['email', 1],
      ['phone', 1],
      ['description', 1],
      ['peppolEndpointId', 1],
      ['countryCode', 1],
      ['peppolEndpointSchemeId', 1],
      ['code', 1],
      ['role', 1],
      ['address', 1],
      ['website', 1],
      ['additional', 1],
      ['vatCode', 1],
      ['paymentInformation', 1]
    ]);
  });
});

describe('isItemFromData', () => {
  const valid = { name: 'Item A' };

  it('rejects non-objects and missing name', () => {
    for (const value of NON_OBJECTS) expect(isItemFromData(value)).toBe(false);
    expect(isItemFromData({})).toBe(false);
  });

  it('accepts a minimal and fully populated valid item', () => {
    expect(isItemFromData(valid)).toBe(true);
    expect(
      isItemFromData({
        ...valid,
        id: 1,
        isArchived: false,
        amount: '100',
        description: 'desc',
        unitID: 1,
        categoryID: 2,
        categoryName: 'Cat',
        unitName: 'Unit'
      })
    ).toBe(true);
  });

  it('rejects invalid field types', () => {
    expectFieldRejections(isItemFromData, valid, [
      ['id', 'x'],
      ['isArchived', 'x'],
      ['amount', 1],
      ['description', 1],
      ['unitID', 'x'],
      ['categoryID', 'x'],
      ['categoryName', 1],
      ['unitName', 1]
    ]);
  });
});

describe('isUnitFromData', () => {
  const valid = { name: 'Unit A' };

  it('validates required and optional fields', () => {
    for (const value of NON_OBJECTS) expect(isUnitFromData(value)).toBe(false);
    expect(isUnitFromData({})).toBe(false);
    expect(isUnitFromData(valid)).toBe(true);
    expect(isUnitFromData({ ...valid, id: 1, isArchived: true })).toBe(true);
    expectFieldRejections(isUnitFromData, valid, [
      ['id', 'x'],
      ['isArchived', 'x']
    ]);
  });
});

describe('isCategoryFromData', () => {
  const valid = { name: 'Category A' };

  it('validates required and optional fields', () => {
    for (const value of NON_OBJECTS) expect(isCategoryFromData(value)).toBe(false);
    expect(isCategoryFromData({})).toBe(false);
    expect(isCategoryFromData(valid)).toBe(true);
    expect(isCategoryFromData({ ...valid, id: 1, isArchived: true })).toBe(true);
    expectFieldRejections(isCategoryFromData, valid, [
      ['id', 'x'],
      ['isArchived', 'x']
    ]);
  });
});

describe('isClientFromData', () => {
  const valid = { name: 'Client A', shortName: 'CA' };

  it('rejects non-objects and missing required fields', () => {
    for (const value of NON_OBJECTS) expect(isClientFromData(value)).toBe(false);
    expect(isClientFromData({ name: 'Client A' })).toBe(false);
    expect(isClientFromData({ shortName: 'CA' })).toBe(false);
  });

  it('accepts a minimal and fully populated valid client', () => {
    expect(isClientFromData(valid)).toBe(true);
    expect(
      isClientFromData({
        ...valid,
        id: 1,
        isArchived: false,
        peppolEndpointId: 'id',
        countryCode: 'US',
        peppolEndpointSchemeId: '0088',
        buyerReference: 'ref',
        description: 'desc',
        email: 'test@example.com',
        phone: '+1234567890',
        address: '123 st',
        code: 'C1',
        additional: 'more',
        vatCode: 'VAT1'
      })
    ).toBe(true);
  });

  it('rejects invalid email/phone formats', () => {
    expect(isClientFromData({ ...valid, email: 'bad' })).toBe(false);
    expect(isClientFromData({ ...valid, phone: 'bad' })).toBe(false);
  });

  it('rejects invalid field types', () => {
    expectFieldRejections(isClientFromData, valid, [
      ['id', 'x'],
      ['isArchived', 'x'],
      ['peppolEndpointId', 1],
      ['countryCode', 1],
      ['peppolEndpointSchemeId', 1],
      ['buyerReference', 1],
      ['description', 1],
      ['address', 1],
      ['code', 1],
      ['additional', 1],
      ['vatCode', 1]
    ]);
  });
});

describe('isCurrencyFromData', () => {
  const valid = { subunit: 100, code: 'USD', symbol: '$', text: 'Dollar', format: '{symbol}{amount}' };

  it('rejects non-objects and invalid required fields', () => {
    for (const value of NON_OBJECTS) expect(isCurrencyFromData(value)).toBe(false);
    expectFieldRejections(isCurrencyFromData, valid, [
      ['subunit', 'x'],
      ['code', 1],
      ['symbol', 1],
      ['text', 1],
      ['format', 'not-a-format'],
      ['isArchived', 'x'],
      ['id', 'x']
    ]);
  });

  it('accepts a valid currency', () => {
    expect(isCurrencyFromData(valid)).toBe(true);
    expect(isCurrencyFromData({ ...valid, id: 1, isArchived: false })).toBe(true);
  });
});

describe('isInvoiceBankSnapshotFromData', () => {
  it('rejects non-objects and invalid field types', () => {
    for (const value of NON_OBJECTS_NO_ARRAY) expect(isInvoiceBankSnapshotFromData(value)).toBe(false);
    expectFieldRejections(isInvoiceBankSnapshotFromData, {}, [
      ['name', 1],
      ['id', 'x'],
      ['parentInvoiceId', 'x'],
      ['bankName', 1],
      ['qrCodeFileSize', 'x'],
      ['qrCode', 'not-a-blob']
    ]);
  });

  it('accepts a valid snapshot', () => {
    expect(
      isInvoiceBankSnapshotFromData({
        name: 'Bank',
        id: 1,
        parentInvoiceId: 1,
        bankName: 'Chase',
        accountNumber: '123',
        qrCodeFileSize: 10,
        qrCode: new Uint8Array([1])
      })
    ).toBe(true);
  });
});

describe('isInvoiceBusinessSnapshotFromData', () => {
  it('rejects non-objects and invalid field types', () => {
    for (const value of NON_OBJECTS_NO_ARRAY) expect(isInvoiceBusinessSnapshotFromData(value)).toBe(false);
    expectFieldRejections(isInvoiceBusinessSnapshotFromData, {}, [
      ['businessName', 1],
      ['businessShortName', 1],
      ['id', 'x'],
      ['parentInvoiceId', 'x'],
      ['businessAddress', 1],
      ['businessFileSize', 'x'],
      ['businessLogo', 'not-a-blob']
    ]);
  });

  it('accepts a valid snapshot', () => {
    expect(
      isInvoiceBusinessSnapshotFromData({
        businessName: 'Biz',
        businessShortName: 'B',
        id: 1,
        parentInvoiceId: 1,
        businessFileSize: 10,
        businessLogo: new Uint8Array([1])
      })
    ).toBe(true);
  });
});

describe('isInvoiceClientSnapshotFromData', () => {
  it('rejects non-objects and invalid field types', () => {
    for (const value of NON_OBJECTS_NO_ARRAY) expect(isInvoiceClientSnapshotFromData(value)).toBe(false);
    expectFieldRejections(isInvoiceClientSnapshotFromData, {}, [
      ['clientName', 1],
      ['id', 'x'],
      ['parentInvoiceId', 'x'],
      ['clientAddress', 1]
    ]);
  });

  it('accepts a valid snapshot', () => {
    expect(isInvoiceClientSnapshotFromData({ clientName: 'Client', id: 1, parentInvoiceId: 1 })).toBe(true);
  });
});

describe('isInvoiceCurrencySnapshotFromData', () => {
  it('rejects non-objects and invalid field types', () => {
    for (const value of NON_OBJECTS_NO_ARRAY) expect(isInvoiceCurrencySnapshotFromData(value)).toBe(false);
    expectFieldRejections(isInvoiceCurrencySnapshotFromData, {}, [
      ['id', 'x'],
      ['parentInvoiceId', 'x'],
      ['currencyCode', 1],
      ['currencySymbol', 1],
      ['currencySubunit', 'x']
    ]);
  });

  it('accepts a valid snapshot', () => {
    expect(
      isInvoiceCurrencySnapshotFromData({ id: 1, parentInvoiceId: 1, currencyCode: 'USD', currencySubunit: 100 })
    ).toBe(true);
  });
});

describe('isInvoiceCustomizationFromData', () => {
  it('rejects non-objects and invalid field types', () => {
    for (const value of NON_OBJECTS_NO_ARRAY) expect(isInvoiceCustomizationFromData(value)).toBe(false);
    expectFieldRejections(isInvoiceCustomizationFromData, {}, [
      ['pdfTexts', { unknownKey: 'x' }],
      ['fieldSortOrders', { no: 'x' }],
      ['id', 'x'],
      ['parentInvoiceId', 'x'],
      ['color', 1],
      ['labelUpperCase', 'x'],
      ['showQuantity', 'x'],
      ['watermarkFileName', 1],
      ['watermarkFileSize', 'x'],
      ['watermarkFileData', 'not-a-blob'],
      ['paidWatermarkFileData', 'not-a-blob']
    ]);
  });

  it('accepts a valid customization', () => {
    expect(
      isInvoiceCustomizationFromData({
        id: 1,
        parentInvoiceId: 1,
        color: '#fff',
        labelUpperCase: true,
        showQuantity: true,
        watermarkFileData: new Uint8Array([1]),
        paidWatermarkFileData: new Uint8Array([1])
      })
    ).toBe(true);
  });
});

describe('isInvoiceFromData', () => {
  const valid = { invoiceType: 'invoice' };

  it('rejects non-objects and missing invoiceType', () => {
    for (const value of NON_OBJECTS) expect(isInvoiceFromData(value)).toBe(false);
    expect(isInvoiceFromData({})).toBe(false);
  });

  it('accepts a minimal valid invoice', () => {
    expect(isInvoiceFromData(valid)).toBe(true);
  });

  it('rejects invalid nested snapshots and customization', () => {
    expect(isInvoiceFromData({ ...valid, invoiceBankSnapshot: { qrCodeFileSize: 'x' } })).toBe(false);
    expect(isInvoiceFromData({ ...valid, invoiceBusinessSnapshot: { businessFileSize: 'x' } })).toBe(false);
    expect(isInvoiceFromData({ ...valid, invoiceClientSnapshot: { clientName: 1 } })).toBe(false);
    expect(isInvoiceFromData({ ...valid, invoiceCurrencySnapshot: { currencySubunit: 'x' } })).toBe(false);
    expect(isInvoiceFromData({ ...valid, invoiceCustomization: { color: 1 } })).toBe(false);
  });

  it('accepts a fully populated valid invoice', () => {
    expect(
      isInvoiceFromData({
        ...valid,
        businessId: 1,
        clientId: 2,
        currencyId: 3,
        bankId: 4,
        styleProfilesId: 5,
        issuedAt: '2024-01-01',
        language: 'en',
        invoiceNumber: 'INV-1',
        status: 'unpaid',
        invoiceBankSnapshot: { name: 'Bank' },
        invoiceBusinessSnapshot: { businessName: 'Biz' },
        invoiceClientSnapshot: { clientName: 'Client' },
        invoiceCurrencySnapshot: { currencyCode: 'USD' },
        invoiceCustomization: { color: '#fff' },
        taxRate: 10,
        id: 1,
        convertedFromQuotationId: 2,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        dueDate: '2024-01-10',
        isArchived: false,
        customerNotes: 'notes',
        signatureSize: 10,
        signatureData: new Uint8Array([1]),
        discountType: 'fixed',
        surchargeType: 'fixed',
        taxType: 'exclusive'
      })
    ).toBe(true);
  });

  it('rejects invalid field types', () => {
    expectFieldRejections(isInvoiceFromData, valid, [
      ['businessId', 'x'],
      ['clientId', 'x'],
      ['currencyId', 'x'],
      ['bankId', 'x'],
      ['styleProfilesId', 'x'],
      ['issuedAt', 1],
      ['language', 1],
      ['invoiceNumber', 1],
      ['status', 1],
      ['taxRate', 'x'],
      ['id', 'x'],
      ['convertedFromQuotationId', 'x'],
      ['createdAt', 1],
      ['updatedAt', 1],
      ['dueDate', 1],
      ['isArchived', 'x'],
      ['customerNotes', 1],
      ['signatureSize', 'x'],
      ['signatureData', 'not-a-blob'],
      ['discountType', 1],
      ['surchargeType', 1],
      ['taxType', 1]
    ]);
  });
});
