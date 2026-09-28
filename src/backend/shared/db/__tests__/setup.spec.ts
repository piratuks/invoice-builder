import fs from 'fs';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';
import { getTableColumns, isTableExists } from '../../utils/dbHelper';
import { createSqliteAdapter } from '../client';
import { initSchema, openPostgreSql, openSqlLite, testPostgresConnection } from '../setup';

const activeClient = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('pg', () => ({
  Client: vi.fn().mockImplementation(function (this: unknown) {
    return activeClient.current;
  })
}));

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');
  return { ...actual, createPostgresAdapter: vi.fn(() => Promise.resolve({ type: 'PostgreSQL' })) };
});

const makeMockClient = () => ({
  connect: vi.fn(() => Promise.resolve()),
  query: vi.fn<(...args: unknown[]) => Promise<{ rowCount: number; rows: unknown[] }>>(() =>
    Promise.resolve({ rowCount: 0, rows: [] })
  ),
  end: vi.fn(() => Promise.resolve())
});

describe('initSchema invoice item quantity', () => {
  it('creates a text quantity column with a zero default', async () => {
    const db = createSqliteAdapter(new sqlite3.Database(':memory:'));

    await initSchema(db);
    expect(await isTableExists(db, 'migrations')).toBe(true);
    expect((await getTableColumns(db, 'migrations')).map(column => column.name)).toEqual(
      expect.arrayContaining(['name', 'appliedAt'])
    );
    const quantityColumn = (await getTableColumns(db, 'invoice_items')).find(column => column.name === 'quantity');
    expect(quantityColumn?.type).toBe('TEXT');
    const initialQuantityDefault = await db.get<{ dflt_value: string }>(
      `SELECT dflt_value FROM pragma_table_info('invoice_items') WHERE name = 'quantity'`
    );
    expect(initialQuantityDefault?.dflt_value).toBe("'0'");
    const invoiceColumns = await db.all<{ name: string }>(`SELECT name FROM pragma_table_xinfo('invoices')`);
    expect(invoiceColumns).toEqual(
      expect.arrayContaining([
        { name: 'invoicePrefix' },
        { name: 'invoiceSuffix' },
        { name: 'invoiceFullNumber' },
        { name: 'language' },
        { name: 'signatureData' },
        { name: 'signatureName' },
        { name: 'signatureType' },
        { name: 'signatureSize' },
        { name: 'styleProfilesId' },
        { name: 'paidAt' },
        { name: 'closedAt' },
        { name: 'surchargeName' },
        { name: 'surchargeType' },
        { name: 'surchargeAmountCents' },
        { name: 'surchargePercent' },
        { name: 'bankId' },
        { name: 'layoutId' }
      ])
    );
    const invoiceTableDefinition = await db.get<{ sql: string }>(
      `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'invoices'`
    );
    expect(invoiceTableDefinition?.sql).toContain(
      'UNIQUE ("businessId", "invoiceFullNumber", "clientId", "invoiceType")'
    );
    const invoiceColumnNames = (await getTableColumns(db, 'invoices')).map(column => column.name);
    expect(invoiceColumnNames).not.toContain('businessNameSnapshot');
    expect(invoiceColumnNames).not.toContain('styleProfileNameSnapshot');
    const invoiceColumnsMetadata = await getTableColumns(db, 'invoices');
    expect(invoiceColumnsMetadata.find(column => column.name === 'discountAmountCents')?.type).toBe('TEXT');
    expect(invoiceColumnsMetadata.find(column => column.name === 'shippingFeeCents')?.type).toBe('TEXT');
    const paymentAmountColumn = (await getTableColumns(db, 'invoice_payments')).find(
      column => column.name === 'amountCents'
    );
    expect(paymentAmountColumn?.type).toBe('TEXT');
    expect(
      (await getTableColumns(db, 'invoice_item_snapshots')).find(column => column.name === 'unitPriceCents')?.type
    ).toBe('TEXT');
    const invoiceItemColumnNames = (await getTableColumns(db, 'invoice_items')).map(column => column.name);
    expect(invoiceItemColumnNames).not.toContain('itemNameSnapshot');
    expect(await isTableExists(db, 'invoice_business_snapshots')).toBe(true);
    expect(await isTableExists(db, 'invoice_client_snapshots')).toBe(true);
    expect(await isTableExists(db, 'invoice_currency_snapshots')).toBe(true);
    expect(await isTableExists(db, 'invoice_customizations')).toBe(true);
    expect(await isTableExists(db, 'invoice_style_profile_snapshots')).toBe(true);
    expect(await isTableExists(db, 'invoice_item_snapshots')).toBe(true);
    expect(await isTableExists(db, 'banks')).toBe(true);
    expect(await isTableExists(db, 'invoice_bank_snapshots')).toBe(true);
    expect(await isTableExists(db, 'layouts')).toBe(true);
    expect(await isTableExists(db, 'invoice_layout_snapshots')).toBe(true);
    expect(await isTableExists(db, 'presets')).toBe(true);
    expect((await getTableColumns(db, 'presets')).map(column => column.name)).toEqual(
      expect.arrayContaining(['name', 'businessId', 'clientId', 'currencyId', 'bankId', 'styleProfilesId'])
    );
    expect(await isTableExists(db, 'invoice_sequences')).toBe(true);
    expect(await isTableExists(db, 'workspaces')).toBe(true);
    expect(await isTableExists(db, 'sessions')).toBe(true);
    expect((await getTableColumns(db, 'workspaces')).map(column => column.name)).toEqual(
      expect.arrayContaining(['workspaceId', 'databaseKey', 'createdAt', 'updatedAt'])
    );
    expect((await getTableColumns(db, 'sessions')).map(column => column.name)).toEqual(
      expect.arrayContaining(['token', 'workspaceId', 'databaseKey', 'createdAt', 'updatedAt', 'expiresAt'])
    );
    expect((await getTableColumns(db, 'invoice_sequences')).map(column => column.name)).toEqual(
      expect.arrayContaining(['businessId', 'clientId', 'nextSequence', 'invoiceType'])
    );
    expect((await getTableColumns(db, 'banks')).map(column => column.name)).toEqual(
      expect.arrayContaining(['accountHolder', 'sortOrder'])
    );
    expect((await getTableColumns(db, 'invoice_bank_snapshots')).map(column => column.name)).toEqual(
      expect.arrayContaining(['accountHolder', 'sortOrder'])
    );
    expect((await getTableColumns(db, 'businesses')).map(column => column.name)).toEqual(
      expect.arrayContaining(['vatCode', 'code', 'peppolEndpointId', 'countryCode', 'peppolEndpointSchemeId'])
    );
    expect((await getTableColumns(db, 'clients')).map(column => column.name)).toEqual(
      expect.arrayContaining(['vatCode', 'peppolEndpointId', 'countryCode', 'peppolEndpointSchemeId', 'buyerReference'])
    );
    expect((await getTableColumns(db, 'invoice_business_snapshots')).map(column => column.name)).toContain(
      'businessVatCode'
    );
    expect((await getTableColumns(db, 'invoice_business_snapshots')).map(column => column.name)).toEqual(
      expect.arrayContaining([
        'businessCode',
        'businessPeppolEndpointId',
        'businessCountryCode',
        'businessPeppolEndpointSchemeId'
      ])
    );
    expect((await getTableColumns(db, 'invoice_client_snapshots')).map(column => column.name)).toContain(
      'clientVatCode'
    );
    expect((await getTableColumns(db, 'invoice_client_snapshots')).map(column => column.name)).toEqual(
      expect.arrayContaining([
        'clientPeppolEndpointId',
        'clientCountryCode',
        'clientPeppolEndpointSchemeId',
        'clientBuyerReference'
      ])
    );
    const settingsColumns = (await getTableColumns(db, 'settings')).map(column => column.name);
    expect(settingsColumns).toEqual(
      expect.arrayContaining(['styleProfilesON', 'presetsON', 'ublON', 'xrechnungON', 'receiptPrintingOn'])
    );
    expect((await getTableColumns(db, 'style_profiles')).map(column => column.name)).toEqual(
      expect.arrayContaining([
        'name',
        'color',
        'fontSize',
        'fontFamily',
        'pdfTexts',
        'layoutId',
        'showQuantity',
        'showUnit',
        'showRowNo',
        'fieldSortOrders'
      ])
    );
    expect((await getTableColumns(db, 'invoice_customizations')).map(column => column.name)).toEqual(
      expect.arrayContaining(['showQuantity', 'showUnit', 'showRowNo', 'fieldSortOrders', 'fontFamily', 'pdfTexts'])
    );
    expect((await getTableColumns(db, 'invoice_customizations')).map(column => column.name)).not.toContain('layout');
    expect((await getTableColumns(db, 'invoice_items')).map(column => column.name)).toContain('customField');
    await db.close();
  });
});

describe('testPostgresConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when no config is provided', async () => {
    await expect(testPostgresConnection(undefined)).rejects.toThrow('error.connectionFailed');
  });

  it('connects, queries and ends the client on success', async () => {
    const client = makeMockClient();

    activeClient.current = client;

    await testPostgresConnection({
      host: 'localhost',
      port: 5432,
      user: 'u',
      password: 'p',
      database: 'db',
      ssl: false
    });

    expect(client.connect).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith('SELECT 1');
    expect(client.end).toHaveBeenCalled();
  });

  it('throws a mapped error when the connection fails', async () => {
    const client = makeMockClient();
    vi.mocked(client.connect).mockRejectedValue(new Error('ECONNREFUSED'));

    activeClient.current = client;

    await expect(
      testPostgresConnection({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'db', ssl: false })
    ).rejects.toThrow('error.connectionFailed');
    expect(client.end).toHaveBeenCalled();
  });

  it('still resolves when ending the client fails', async () => {
    const client = makeMockClient();
    vi.mocked(client.end).mockRejectedValue(new Error('end failed'));

    activeClient.current = client;

    await expect(
      testPostgresConnection({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'db', ssl: false })
    ).resolves.toBeUndefined();
  });
});

describe('openPostgreSql', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid database names before attempting a connection', async () => {
    await expect(
      openPostgreSql({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: '  ', ssl: false })
    ).rejects.toThrow('error.invalidDBName');
    await expect(
      openPostgreSql({
        host: 'localhost',
        port: 5432,
        user: 'u',
        password: 'p',
        database: 'a'.repeat(64),
        ssl: false
      })
    ).rejects.toThrow('error.databaseNameTooLong');
    await expect(
      openPostgreSql({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'bad name!', ssl: false })
    ).rejects.toThrow('error.databaseNameInvalid');
  });

  it('creates the database when it does not already exist', async () => {
    const client = makeMockClient();

    activeClient.current = client;

    const result = await openPostgreSql({
      host: 'localhost',
      port: 5432,
      user: 'u',
      password: 'p',
      database: 'my_db',
      ssl: false
    });

    expect(client.query).toHaveBeenCalledWith('CREATE DATABASE "my_db"');
    expect(result.db.type).toBe('PostgreSQL');
  });

  it('does not recreate the database when it already exists', async () => {
    const client = makeMockClient();
    vi.mocked(client.query).mockResolvedValue({ rowCount: 1, rows: [{}] });

    activeClient.current = client;

    await openPostgreSql({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'my_db', ssl: false });

    expect(client.query).not.toHaveBeenCalledWith('CREATE DATABASE "my_db"');
  });

  it('throws a mapped error when database creation fails', async () => {
    const client = makeMockClient();
    vi.mocked(client.connect).mockRejectedValue(new Error('boom'));

    activeClient.current = client;

    await expect(
      openPostgreSql({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'my_db', ssl: false })
    ).rejects.toThrow('error.databaseCreationFailed');
  });
});

describe('openSqlLite', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('throws when no path is provided', async () => {
    await expect(openSqlLite({ fullPath: undefined, createIfMissing: true })).rejects.toThrow(
      'error.databasePathInvalid'
    );
  });

  it('creates a new database file, replacing any existing file', async () => {
    const dbPath = path.join(tempDir, 'nested', 'db.sqlite');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, 'old-content');

    const { db } = await openSqlLite({ fullPath: dbPath, createIfMissing: true });
    expect(db.type).toBe('SQLite');
    await db.close();
  });

  it('throws when opening a missing file with createIfMissing false', async () => {
    const dbPath = path.join(tempDir, 'missing.sqlite');
    await expect(openSqlLite({ fullPath: dbPath, createIfMissing: false })).rejects.toThrow(
      'error.databaseFileNotExist'
    );
  });

  it('opens an existing database file without recreating it', async () => {
    const dbPath = path.join(tempDir, 'existing.sqlite');
    const { db: initial } = await openSqlLite({ fullPath: dbPath, createIfMissing: true });
    await initial.close();

    const { db } = await openSqlLite({ fullPath: dbPath, createIfMissing: false });
    expect(db.type).toBe('SQLite');
    await db.close();
  });
});
