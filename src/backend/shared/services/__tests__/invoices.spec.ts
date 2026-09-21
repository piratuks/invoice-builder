import { Alignment } from '../../enums/alignment';
import { EInvoice } from '../../enums/einvoice';
import { FilterType } from '../../enums/filterType';
import { FontFamily } from '../../enums/fontFamily';
import { InvoiceStatus } from '../../enums/invoiceStatus';
import { InvoiceType } from '../../enums/invoiceType';
import { Language } from '../../enums/language';
import { PageFormat } from '../../enums/pageFormat';
import { SizeType } from '../../enums/sizeType';
import { TableHeaderStyle } from '../../enums/tableHeaderStyle';
import { TableRowStyle } from '../../enums/tableRowStyle';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';
import type {
  Invoice,
  InvoiceBusinessSnapshots,
  InvoiceClientSnapshots,
  InvoiceCurrencySnapshots,
  InvoicePayment
} from '../../types/invoice';
import {
  addInvoice,
  deleteInvoice,
  duplicateInvoice,
  getAllInvoices,
  getCustomHeaders,
  getInvoiceXML,
  getNextSequence,
  updateInvoice
} from '../invoices';
import { createTestDatabase } from './testDb';

const insertBusiness = async (db: DatabaseAdapter, name: string, shortName: string) => {
  return db.run(`INSERT INTO businesses ("name", "shortName") VALUES (?, ?);`, [name, shortName], true);
};

const insertClient = async (db: DatabaseAdapter, name: string, shortName: string) => {
  return db.run(`INSERT INTO clients ("name", "shortName") VALUES (?, ?);`, [name, shortName], true);
};

const getCurrencyId = async (db: DatabaseAdapter, code: string) => {
  const row = await db.get<{ id: number }>(`SELECT id FROM currencies WHERE code = ?;`, [code]);
  return row?.id ?? -1;
};

type NewInvoicePayload = Omit<
  Invoice,
  'invoiceBusinessSnapshot' | 'invoiceClientSnapshot' | 'invoiceCurrencySnapshot'
> & {
  invoiceBusinessSnapshot: Omit<InvoiceBusinessSnapshots, 'parentInvoiceId'> & { parentInvoiceId: number };
  invoiceClientSnapshot: Omit<InvoiceClientSnapshots, 'parentInvoiceId'> & { parentInvoiceId: number };
  invoiceCurrencySnapshot: Omit<InvoiceCurrencySnapshots, 'parentInvoiceId'> & { parentInvoiceId: number };
};

const createInvoicePayload = (
  businessId: number,
  clientId: number,
  currencyId: number,
  invoiceNumber: string,
  invoiceType: InvoiceType = InvoiceType.invoice
): NewInvoicePayload => {
  const now = new Date().toISOString();
  return {
    invoiceType,
    businessId,
    clientId,
    currencyId,
    createdAt: now,
    updatedAt: now,
    issuedAt: now,
    invoiceNumber,
    isArchived: false,
    status: InvoiceStatus.unpaid,
    customerNotes: undefined,
    thanksNotes: undefined,
    termsConditionNotes: undefined,
    discountName: undefined,
    invoicePrefix: undefined,
    invoiceSuffix: undefined,
    discountType: undefined,
    discountAmountCents: '0',
    discountPercent: 0,
    shippingFeeCents: '0',
    surchargeName: undefined,
    surchargeAmountCents: '0',
    surchargeType: undefined,
    surchargePercent: 0,
    taxName: undefined,
    taxRate: 0,
    taxType: undefined,
    invoicePayments: [],
    invoiceItems: [],
    invoiceAttachments: [],
    currencyFormat: 'USD',
    language: Language.en,
    invoiceBusinessSnapshot: {
      parentInvoiceId: 0,
      businessName: `Biz ${businessId}`,
      businessShortName: `B${businessId}`,
      businessAddress: undefined,
      businessRole: undefined,
      businessEmail: undefined,
      businessPhone: undefined,
      businessAdditional: undefined,
      businessPaymentInformation: undefined,
      businessLogo: undefined,
      businessFileSize: undefined,
      businessFileType: undefined,
      businessFileName: undefined
    },
    invoiceClientSnapshot: {
      parentInvoiceId: 0,
      clientName: `Client ${clientId}`,
      clientAddress: undefined,
      clientEmail: undefined,
      clientPhone: undefined,
      clientCode: undefined,
      clientAdditional: undefined
    },
    invoiceCurrencySnapshot: {
      parentInvoiceId: 0,
      currencyCode: 'USD',
      currencySymbol: '$',
      currencySubunit: 100
    }
  };
};

const loadNextSequence = async (
  db: DatabaseAdapter,
  businessId: number,
  clientId: number,
  invoiceType: InvoiceType = InvoiceType.invoice
) => {
  const row = await db.get<{ nextSequence: number }>(
    `SELECT "nextSequence" FROM invoice_sequences WHERE "businessId" = ? AND "clientId" = ? AND "invoiceType" = ?;`,
    [businessId, clientId, invoiceType]
  );
  return row?.nextSequence;
};

const addOptionalInvoiceData = async (db: DatabaseAdapter, payload: NewInvoicePayload) => {
  const itemId = await db.run(`INSERT INTO items ("name", "amount") VALUES ('Consulting', '12500');`, [], true);
  const bankId = await db.run(
    `INSERT INTO banks ("name", "bankName", "accountNumber") VALUES ('Primary', 'Test Bank', '123');`,
    [],
    true
  );
  const styleProfilesId = await db.run(`INSERT INTO style_profiles ("name") VALUES ('Detailed');`, [], true);
  const layoutId = await db.run(`INSERT INTO layouts ("schema") VALUES ('{}');`, [], true);
  const now = new Date().toISOString();

  payload.bankId = bankId;
  payload.styleProfilesId = styleProfilesId;
  payload.layoutId = layoutId;
  payload.invoiceBankSnapshot = {
    parentInvoiceId: 0,
    name: 'Primary',
    bankName: 'Test Bank',
    accountNumber: '123'
  };
  payload.invoiceStyleProfileSnapshot = { parentInvoiceId: 0, styleProfileName: 'Detailed' };
  payload.invoiceLayoutSnapshot = {
    parentInvoiceId: 0,
    layoutSchema: { sections: ['summary'] } as unknown as string
  };
  payload.invoiceCustomization = {
    parentInvoiceId: 0,
    color: '#123456',
    logoSize: SizeType.medium,
    fontSize: SizeType.small,
    fontFamily: FontFamily.roboto,
    tableHeaderStyle: TableHeaderStyle.dark,
    tableRowStyle: TableRowStyle.bordered,
    pageFormat: PageFormat.a4,
    labelUpperCase: true,
    showQuantity: true,
    showUnit: false,
    showRowNo: true,
    fieldSortOrders: { no: 0, item: 1, unit: 2, quantity: 3, unitCost: 4, total: 5 },
    pdfTexts: { invoiceNo: 'Document number' }
  };
  payload.invoiceItems = [
    {
      id: 0,
      parentInvoiceId: 0,
      itemId,
      quantity: '2',
      taxRate: 0,
      customField: { header: 'Project', value: 'Alpha', sortOrder: 6, alignment: Alignment.left },
      createdAt: now,
      updatedAt: now,
      invoiceItemSnapshot: {
        parentInvoiceItemId: 0,
        itemName: 'Consulting',
        unitPriceCents: '12500',
        unitName: 'hour'
      }
    }
  ];
  payload.invoicePayments = [
    {
      id: 0,
      parentInvoiceId: 0,
      amountCents: '5000',
      paidAt: now,
      paymentMethod: 'card',
      notes: 'Deposit',
      createdAt: now,
      updatedAt: now
    }
  ];
  payload.invoiceAttachments = [
    {
      id: 0,
      parentInvoiceId: 0,
      fileSize: 3,
      fileType: 'text/plain',
      fileName: 'terms.txt',
      data: Buffer.from('abc'),
      createdAt: now,
      updatedAt: now
    }
  ];
};

describe('invoice sequence handling', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('creates a client-scoped sequence row on addInvoice when missing and advances sequentially', async () => {
    const businessId = await insertBusiness(db, 'Business A', 'BA');
    const clientId = await insertClient(db, 'Client A', 'CA');
    const currencyId = await getCurrencyId(db, 'USD');

    await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '1'));

    const result = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '2'));
    expect(result.success).toBe(true);

    const sequenceAfterSecondInvoice = await loadNextSequence(db, businessId, clientId);
    expect(sequenceAfterSecondInvoice).toBe(3);
    expect((await getNextSequence(db, { businessId, clientId, invoiceType: InvoiceType.invoice })).data).toEqual({
      nextSequence: 3,
      formattedSequence: '3'
    });
  });

  it('duplicates an invoice to the next client-scoped sequence when sequence row is missing', async () => {
    const businessId = await insertBusiness(db, 'Business B', 'BB');
    const clientId = await insertClient(db, 'Client B', 'CB');
    const currencyId = await getCurrencyId(db, 'USD');

    const originalResult = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '3'));
    expect(originalResult.success).toBe(true);
    expect(originalResult.data).toBeDefined();

    const originalInvoice = originalResult.data as Invoice;
    expect(originalInvoice.id).toBeDefined();

    const result = await duplicateInvoice(db, originalInvoice.id as number, InvoiceType.invoice);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    const duplicatedInvoice = result.data as Invoice;
    expect(duplicatedInvoice.invoiceNumber).toBe('4');

    const sequence = await loadNextSequence(db, businessId, clientId);
    expect(sequence).toBe(5);
    expect((await getNextSequence(db, { businessId, clientId, invoiceType: InvoiceType.invoice })).data).toEqual({
      nextSequence: 5,
      formattedSequence: '5'
    });
  });

  it('preserves leading-zero width when suggesting the next sequence', async () => {
    const businessId = await insertBusiness(db, 'Business C', 'BC');
    const clientId = await insertClient(db, 'Client C', 'CC');
    const currencyId = await getCurrencyId(db, 'USD');

    const result = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '000009'));
    expect(result.success).toBe(true);

    expect((await getNextSequence(db, { businessId, clientId, invoiceType: InvoiceType.invoice })).data).toEqual({
      nextSequence: 10,
      formattedSequence: '000010'
    });
  });

  it('handles carry for padded values (000999 -> 001000)', async () => {
    const businessId = await insertBusiness(db, 'Business F', 'BF');
    const clientId = await insertClient(db, 'Client F', 'CF');
    const currencyId = await getCurrencyId(db, 'USD');

    const result = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '000999'));
    expect(result.success).toBe(true);

    expect((await getNextSequence(db, { businessId, clientId, invoiceType: InvoiceType.invoice })).data).toEqual({
      nextSequence: 1000,
      formattedSequence: '001000'
    });
  });

  it('expands width when incremented sequence exceeds current padding length', async () => {
    const businessId = await insertBusiness(db, 'Business D', 'BD');
    const clientId = await insertClient(db, 'Client D', 'CD');
    const currencyId = await getCurrencyId(db, 'USD');

    const result = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '999999'));
    expect(result.success).toBe(true);

    expect((await getNextSequence(db, { businessId, clientId, invoiceType: InvoiceType.invoice })).data).toEqual({
      nextSequence: 1000000,
      formattedSequence: '1000000'
    });
  });

  it('duplicates invoices using padded sequence formatting', async () => {
    const businessId = await insertBusiness(db, 'Business E', 'BE');
    const clientId = await insertClient(db, 'Client E', 'CE');
    const currencyId = await getCurrencyId(db, 'USD');

    const originalResult = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '000005'));
    expect(originalResult.success).toBe(true);

    const originalInvoice = originalResult.data as Invoice;
    const duplicateResult = await duplicateInvoice(db, originalInvoice.id as number, InvoiceType.invoice);

    expect(duplicateResult.success).toBe(true);
    expect((duplicateResult.data as Invoice).invoiceNumber).toBe('000006');

    expect((await getNextSequence(db, { businessId, clientId, invoiceType: InvoiceType.invoice })).data).toEqual({
      nextSequence: 7,
      formattedSequence: '000007'
    });
  });

  it('preserves the quotation number and sequence when converting to an invoice', async () => {
    const businessId = await insertBusiness(db, 'Business Conversion', 'BC');
    const clientId = await insertClient(db, 'Client Conversion', 'CC');
    const currencyId = await getCurrencyId(db, 'USD');

    const quotationResult = await addInvoice(
      db,
      createInvoicePayload(businessId, clientId, currencyId, '000005', InvoiceType.quotation)
    );
    expect(quotationResult.success).toBe(true);

    const quotation = quotationResult.data as Invoice;
    const conversionSequenceBefore = await getNextSequence(db, {
      businessId,
      clientId,
      invoiceType: InvoiceType.invoice
    });
    const conversionResult = await duplicateInvoice(db, quotation.id as number, InvoiceType.invoice);

    expect(conversionResult.success).toBe(true);
    expect((conversionResult.data as Invoice).invoiceType).toBe(InvoiceType.quotation);
    expect((conversionResult.data as Invoice).invoiceNumber).toBe('000005');
    expect((await getNextSequence(db, { businessId, clientId, invoiceType: InvoiceType.invoice })).data).toEqual({
      nextSequence: 6,
      formattedSequence: '000006'
    });

    const repeatedConversionResult = await duplicateInvoice(db, quotation.id as number, InvoiceType.invoice);
    expect(repeatedConversionResult.success).toBe(true);
    expect((repeatedConversionResult.data as Invoice).invoiceType).toBe(InvoiceType.quotation);
    expect((repeatedConversionResult.data as Invoice).invoiceNumber).toBe('000005');
    const repeatedInvoice = await db.get(
      `SELECT "id" FROM invoices WHERE "businessId" = ? AND "clientId" = ? AND "invoiceType" = ? AND "invoiceNumber" = ?`,
      [businessId, clientId, InvoiceType.invoice, '000006']
    );
    expect(repeatedInvoice).toBeDefined();
    expect((await getNextSequence(db, { businessId, clientId, invoiceType: InvoiceType.invoice })).data).toEqual({
      nextSequence: 7,
      formattedSequence: '000007'
    });
    expect(conversionSequenceBefore.data).toBeUndefined();
  });

  it('does not increment sequence when updating an existing invoice', async () => {
    const businessId = await insertBusiness(db, 'Business G', 'BG');
    const clientId = await insertClient(db, 'Client G', 'CG');
    const currencyId = await getCurrencyId(db, 'USD');

    const addResult = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '000005'));
    expect(addResult.success).toBe(true);

    const sequenceBeforeUpdate = await getNextSequence(db, {
      businessId,
      clientId,
      invoiceType: InvoiceType.invoice
    });
    expect(sequenceBeforeUpdate.data).toEqual({
      nextSequence: 6,
      formattedSequence: '000006'
    });

    const invoice = addResult.data as Invoice;
    const updateResult = await updateInvoice(db, {
      ...invoice,
      customerNotes: 'Updated note'
    });
    expect(updateResult.success).toBe(true);

    const sequenceAfterUpdate = await getNextSequence(db, {
      businessId,
      clientId,
      invoiceType: InvoiceType.invoice
    });
    expect(sequenceAfterUpdate.data).toEqual({
      nextSequence: 6,
      formattedSequence: '000006'
    });
  });

  it('updates sequence when invoice number changes during update', async () => {
    const businessId = await insertBusiness(db, 'Business H', 'BH');
    const clientId = await insertClient(db, 'Client H', 'CH');
    const currencyId = await getCurrencyId(db, 'USD');

    const addResult = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '000005'));
    expect(addResult.success).toBe(true);

    const invoice = addResult.data as Invoice;
    const updateResult = await updateInvoice(db, {
      ...invoice,
      invoiceNumber: '000010'
    });
    expect(updateResult.success).toBe(true);

    const sequenceAfterUpdate = await getNextSequence(db, {
      businessId,
      clientId,
      invoiceType: InvoiceType.invoice
    });
    expect(sequenceAfterUpdate.data).toEqual({
      nextSequence: 11,
      formattedSequence: '000011'
    });
  });
});

describe('invoice retrieval', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('returns an empty batch when no invoices match', async () => {
    await expect(getAllInvoices(db, InvoiceType.invoice)).resolves.toEqual({ success: true, data: [] });
  });

  it('combines invoice type, active status, client, and status filters', async () => {
    const businessId = await insertBusiness(db, 'Filtered Business', 'FB');
    const clientId = await insertClient(db, 'Filtered Client', 'FC');
    const currencyId = await getCurrencyId(db, 'USD');

    const invoice = createInvoicePayload(businessId, clientId, currencyId, 'filter-invoice');
    const quotation = createInvoicePayload(businessId, clientId, currencyId, 'filter-quotation', InvoiceType.quotation);
    quotation.status = InvoiceStatus.paid;

    expect((await addInvoice(db, invoice)).success).toBe(true);
    expect((await addInvoice(db, quotation)).success).toBe(true);

    const result = await getAllInvoices(db, InvoiceType.invoice, [
      { type: FilterType.active, value: '' },
      { type: FilterType.client, value: `Client ${clientId}` },
      { type: FilterType.status, value: InvoiceStatus.unpaid }
    ]);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({ invoiceNumber: 'filter-invoice', invoiceType: InvoiceType.invoice });
  });

  it('round-trips optional child data without mixing batched invoice associations', async () => {
    const businessId = await insertBusiness(db, 'Batch Business', 'BB');
    const clientId = await insertClient(db, 'Batch Client', 'BC');
    const currencyId = await getCurrencyId(db, 'USD');
    const detailedPayload = createInvoicePayload(businessId, clientId, currencyId, 'batch-detailed');
    detailedPayload.status = InvoiceStatus.paid;
    await addOptionalInvoiceData(db, detailedPayload);

    expect((await addInvoice(db, detailedPayload)).success).toBe(true);
    expect((await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, 'batch-plain'))).success).toBe(
      true
    );

    const result = await getAllInvoices(db, InvoiceType.invoice);
    const detailed = result.data.find(invoice => invoice.invoiceNumber === 'batch-detailed');
    const plain = result.data.find(invoice => invoice.invoiceNumber === 'batch-plain');

    expect(result.data).toHaveLength(2);
    expect(detailed).toMatchObject({
      paidAt: expect.any(String),
      closedAt: null,
      invoiceBankSnapshot: { name: 'Primary' },
      invoiceStyleProfileSnapshot: { styleProfileName: 'Detailed' },
      invoiceLayoutSnapshot: { layoutSchema: { sections: ['summary'] } },
      invoiceCustomization: {
        fieldSortOrders: { no: 0, item: 1, unit: 2, quantity: 3, unitCost: 4, total: 5 },
        pdfTexts: { invoiceNo: 'Document number' }
      },
      invoiceItems: [
        {
          customField: { header: 'Project', value: 'Alpha', sortOrder: 6, alignment: Alignment.left },
          invoiceItemSnapshot: { itemName: 'Consulting', unitPriceCents: '12500', unitName: 'hour' }
        }
      ],
      invoicePayments: [{ amountCents: '5000', paymentMethod: 'card' }],
      invoiceAttachments: [{ fileName: 'terms.txt', fileType: 'text/plain' }]
    });
    expect(plain).toMatchObject({
      invoiceItems: [],
      invoicePayments: [],
      invoiceAttachments: [],
      invoiceCustomization: undefined,
      invoiceLayoutSnapshot: undefined
    });
  });

  it('updates existing and new children, clears a bank, and replaces removed children', async () => {
    const businessId = await insertBusiness(db, 'Update Business', 'UB');
    const clientId = await insertClient(db, 'Update Client', 'UC');
    const currencyId = await getCurrencyId(db, 'USD');
    const payload = createInvoicePayload(businessId, clientId, currencyId, 'update-children');
    await addOptionalInvoiceData(db, payload);
    const addResult = await addInvoice(db, payload);
    const invoice = addResult.data as Invoice;
    const existingPayment = invoice.invoicePayments[0];
    const now = new Date().toISOString();

    const updateResult = await updateInvoice(db, {
      ...invoice,
      status: InvoiceStatus.closed,
      bankId: undefined,
      invoiceBankSnapshot: undefined,
      invoicePayments: [
        { ...existingPayment, amountCents: '6000', notes: 'Updated deposit' },
        {
          id: 0,
          parentInvoiceId: invoice.id as number,
          amountCents: '1000',
          paidAt: now,
          paymentMethod: 'cash',
          createdAt: now,
          updatedAt: now
        }
      ],
      invoiceAttachments: [],
      invoiceCustomization: {
        ...invoice.invoiceCustomization!,
        color: '#abcdef'
      }
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.data).toMatchObject({
      status: InvoiceStatus.closed,
      paidAt: null,
      closedAt: expect.any(String),
      invoiceBankSnapshot: undefined,
      invoiceAttachments: [],
      invoiceCustomization: { color: '#abcdef' }
    });
    expect((updateResult.data as Invoice).invoicePayments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ amountCents: '6000', notes: 'Updated deposit' }),
        expect.objectContaining({ amountCents: '1000', paymentMethod: 'cash' })
      ])
    );
  });

  it('returns unique custom headers from stored item metadata', async () => {
    const businessId = await insertBusiness(db, 'Header Business', 'HB');
    const clientId = await insertClient(db, 'Header Client', 'HC');
    const currencyId = await getCurrencyId(db, 'USD');
    const payload = createInvoicePayload(businessId, clientId, currencyId, 'headers');
    await addOptionalInvoiceData(db, payload);
    payload.invoiceItems.push({
      ...payload.invoiceItems[0],
      id: 0,
      customField: { header: 'Project', value: 'Beta', sortOrder: 6, alignment: Alignment.left }
    });

    expect((await addInvoice(db, payload)).success).toBe(true);
    await expect(getCustomHeaders(db, InvoiceType.invoice)).resolves.toEqual({
      success: true,
      data: [{ header: 'Project', sortOrder: 6, alignment: Alignment.left }]
    });
  });
});

describe('invoice service errors', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('rolls back the invoice when a child insert fails', async () => {
    const businessId = await insertBusiness(db, 'Rollback Business', 'RB');
    const clientId = await insertClient(db, 'Rollback Client', 'RC');
    const currencyId = await getCurrencyId(db, 'USD');
    const payload = createInvoicePayload(businessId, clientId, currencyId, 'rollback-child');
    const now = new Date().toISOString();
    payload.invoicePayments = [
      {
        id: 0,
        parentInvoiceId: 0,
        amountCents: '100',
        paidAt: now,
        paymentMethod: undefined,
        createdAt: now,
        updatedAt: now
      } as unknown as InvoicePayment
    ];

    expect((await addInvoice(db, payload)).success).toBe(false);
    expect((await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM invoices'))?.count).toBe(0);
  });

  it('rejects duplicate invoice numbers and leaves the original invoice intact', async () => {
    const businessId = await insertBusiness(db, 'Unique Business', 'UB');
    const clientId = await insertClient(db, 'Unique Client', 'UC');
    const currencyId = await getCurrencyId(db, 'USD');
    const payload = createInvoicePayload(businessId, clientId, currencyId, 'duplicate-number');

    expect((await addInvoice(db, payload)).success).toBe(true);
    expect(
      (await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, 'duplicate-number'))).success
    ).toBe(false);
    expect((await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM invoices'))?.count).toBe(1);
  });

  it('reports missing invoices for update, duplicate, and XML generation', async () => {
    const businessId = await insertBusiness(db, 'Missing Business', 'MB');
    const clientId = await insertClient(db, 'Missing Client', 'MC');
    const currencyId = await getCurrencyId(db, 'USD');
    const payload = createInvoicePayload(businessId, clientId, currencyId, 'missing');

    await expect(updateInvoice(db, { ...payload, id: 999 })).resolves.toEqual({
      success: false,
      key: 'error.invoiceNotFound'
    });
    await expect(getInvoiceXML(db, { invoiceId: 999, einvoice: EInvoice.ubl21 })).rejects.toThrow(
      'error.invoiceNotFound'
    );
    await expect(duplicateInvoice(db, 999, InvoiceType.invoice)).resolves.toEqual({ success: false });
  });

  it('deletes an invoice and maps adapter deletion errors', async () => {
    const businessId = await insertBusiness(db, 'Delete Business', 'DB');
    const clientId = await insertClient(db, 'Delete Client', 'DC');
    const currencyId = await getCurrencyId(db, 'USD');
    const added = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, 'delete-me'));
    const invoice = added.data as Invoice;

    await expect(deleteInvoice(db, invoice.id as number)).resolves.toEqual({ success: true });
    await expect(getAllInvoices(db)).resolves.toEqual({ success: true, data: [] });

    const failingDb = {
      type: db.type,
      run: vi.fn().mockRejectedValue(Object.assign(new Error('SQLITE_IOERR: delete failed'), { code: 'SQLITE_IOERR' }))
    } as unknown as DatabaseAdapter;
    await expect(deleteInvoice(failingDb, 1)).resolves.toMatchObject({ success: false, key: 'error.diskIOError' });
  });
});
