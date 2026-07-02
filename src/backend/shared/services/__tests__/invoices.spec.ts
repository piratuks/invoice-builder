import path from 'path';
import sqlite3 from 'sqlite3';
import { createSqliteAdapter } from '../../db/client';
import { runMigrations } from '../../db/migrationRunner';
import { initInitialData, initSchema } from '../../db/setup';
import { InvoiceStatus } from '../../enums/invoiceStatus';
import { InvoiceType } from '../../enums/invoiceType';
import { Language } from '../../enums/language';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';
import type {
  Invoice,
  InvoiceBusinessSnapshots,
  InvoiceClientSnapshots,
  InvoiceCurrencySnapshots
} from '../../types/invoice';
import { addInvoice, duplicateInvoice, getNextSequence, updateInvoice } from '../invoices';

const createTestDatabase = async (): Promise<DatabaseAdapter> => {
  const sqlite = new sqlite3.Database(':memory:');
  const db = createSqliteAdapter(sqlite);
  await initSchema(db);
  await runMigrations(db, path.resolve(__dirname, '../../../../../dist-be/backend/migrations'));
  await initInitialData(db);
  return db;
};

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
  invoiceNumber: string
): NewInvoicePayload => {
  const now = new Date().toISOString();
  return {
    invoiceType: InvoiceType.invoice,
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

const loadNextSequence = async (db: DatabaseAdapter, businessId: number, clientId: number) => {
  const row = await db.get<{ nextSequence: number }>(
    `SELECT "nextSequence" FROM invoice_sequences WHERE "businessId" = ? AND "clientId" = ?;`,
    [businessId, clientId]
  );
  return row?.nextSequence;
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
    expect((await getNextSequence(db, { businessId, clientId })).data).toEqual({
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
    expect((await getNextSequence(db, { businessId, clientId })).data).toEqual({
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

    expect((await getNextSequence(db, { businessId, clientId })).data).toEqual({
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

    expect((await getNextSequence(db, { businessId, clientId })).data).toEqual({
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

    expect((await getNextSequence(db, { businessId, clientId })).data).toEqual({
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

    expect((await getNextSequence(db, { businessId, clientId })).data).toEqual({
      nextSequence: 7,
      formattedSequence: '000007'
    });
  });

  it('does not increment sequence when updating an existing invoice', async () => {
    const businessId = await insertBusiness(db, 'Business G', 'BG');
    const clientId = await insertClient(db, 'Client G', 'CG');
    const currencyId = await getCurrencyId(db, 'USD');

    const addResult = await addInvoice(db, createInvoicePayload(businessId, clientId, currencyId, '000005'));
    expect(addResult.success).toBe(true);

    const sequenceBeforeUpdate = await getNextSequence(db, { businessId, clientId });
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

    const sequenceAfterUpdate = await getNextSequence(db, { businessId, clientId });
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

    const sequenceAfterUpdate = await getNextSequence(db, { businessId, clientId });
    expect(sequenceAfterUpdate.data).toEqual({
      nextSequence: 11,
      formattedSequence: '000011'
    });
  });
});
