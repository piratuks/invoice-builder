import sqlite3 from 'sqlite3';
import { createSqliteAdapter } from '../../db/client';
import { initInitialData, initSchema } from '../../db/setup';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';
import { getTableColumns, isTableExists } from '../../utils/dbHelper';

type LayoutRow = { id: number; schema: string; isArchived: number };

describe('fresh schema setup', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = createSqliteAdapter(new sqlite3.Database(':memory:'));
    await initSchema(db);
    await initInitialData(db);
  });

  it('creates the current schema and its initial data', async () => {
    const invoiceCols = (await getTableColumns(db, 'invoices')).map(c => c.name);
    expect(invoiceCols).toEqual(
      expect.arrayContaining([
        'invoicePrefix',
        'invoiceSuffix',
        'signatureData',
        'discountAmountCents',
        'bankId',
        'surchargeName',
        'surchargeAmountCents',
        'paidAt',
        'closedAt',
        'styleProfilesId'
      ])
    );

    const invoiceItemColumns = await getTableColumns(db, 'invoice_items');
    expect(invoiceItemColumns.find(column => column.name === 'quantity')?.type).toBe('TEXT');

    const settingsCols = (await getTableColumns(db, 'settings')).map(c => c.name);
    expect(settingsCols).toEqual(
      expect.arrayContaining(['styleProfilesON', 'presetsON', 'ublON', 'xrechnungON', 'receiptPrintingOn'])
    );

    const styleProfileCols = (await getTableColumns(db, 'style_profiles')).map(c => c.name);
    expect(styleProfileCols).toEqual(
      expect.arrayContaining([
        'fontSize',
        'showQuantity',
        'showUnit',
        'showRowNo',
        'fieldSortOrders',
        'fontFamily',
        'pdfTexts',
        'layoutId'
      ])
    );
    expect(styleProfileCols).not.toContain('layout');

    const clientCols = (await getTableColumns(db, 'clients')).map(c => c.name);
    expect(clientCols).toEqual(expect.arrayContaining(['vatCode', 'peppolEndpointId', 'countryCode']));

    const businessCols = (await getTableColumns(db, 'businesses')).map(c => c.name);
    expect(businessCols).toEqual(expect.arrayContaining(['vatCode', 'code', 'peppolEndpointId']));

    const banksCols = (await getTableColumns(db, 'banks')).map(c => c.name);
    expect(banksCols).toEqual(expect.arrayContaining(['accountHolder', 'sortOrder']));

    expect(await isTableExists(db, 'banks')).toBe(true);
    expect(await isTableExists(db, 'presets')).toBe(true);
    expect(await isTableExists(db, 'invoice_sequences')).toBe(true);
    expect(await isTableExists(db, 'invoice_business_snapshots')).toBe(true);
    expect(await isTableExists(db, 'invoice_item_snapshots')).toBe(true);
    expect(await isTableExists(db, 'layouts')).toBe(true);

    const sequenceCols = (await getTableColumns(db, 'invoice_sequences')).map(c => c.name);
    expect(sequenceCols).toContain('invoiceType');

    const layouts = await db.all<{ id: number }>('SELECT "id" FROM layouts');
    expect(layouts.length).toBeGreaterThan(0);
  });

  it('seeds active and archived built-in layouts idempotently', async () => {
    await initInitialData(db);
    await initInitialData(db);

    const layouts = await db.all<LayoutRow>('SELECT "id", "schema", "isArchived" FROM layouts ORDER BY "id"');
    const names = layouts.map(layout => JSON.parse(layout.schema).meta.name);

    expect(names).toEqual(
      expect.arrayContaining(['Classic', 'Modern', 'Compact', 'Legacy Classic', 'Legacy Modern', 'Legacy Compact'])
    );
    expect(layouts).toHaveLength(6);

    const archivedByName = new Map(
      layouts.map(layout => [JSON.parse(layout.schema).meta.name as string, Boolean(layout.isArchived)])
    );
    expect(archivedByName.get('Classic')).toBe(false);
    expect(archivedByName.get('Modern')).toBe(false);
    expect(archivedByName.get('Compact')).toBe(false);
    expect(archivedByName.get('Legacy Classic')).toBe(true);
    expect(archivedByName.get('Legacy Modern')).toBe(true);
    expect(archivedByName.get('Legacy Compact')).toBe(true);

    for (const layout of layouts) {
      expect(JSON.parse(layout.schema)).toMatchObject({ schemaVersion: 1, meta: { name: expect.any(String) } });
    }

    const classic = layouts.find(layout => JSON.parse(layout.schema).meta.name === 'Classic');
    const classicHeader = JSON.parse(classic?.schema ?? '{}').sections.find(
      (section: { type: string }) => section.type === 'header'
    );

    expect(classicHeader.blocks[0].children).toEqual([
      expect.objectContaining({ type: 'column', width: '50%' }),
      expect.objectContaining({ type: 'column', width: '50%' })
    ]);
    expect(classicHeader.blocks[0].children[0].children[0]).toMatchObject({ type: 'row', gap: 5 });
    expect(classicHeader.blocks[1]).toMatchObject({ type: 'row', paddingTop: 20 });
    expect(JSON.parse(classic?.schema ?? '{}').sections.map((section: { type: string }) => section.type)).toEqual([
      'watermark',
      'header',
      'itemsTable',
      'financialTotals',
      'paymentInfo',
      'notes',
      'signature',
      'pageCounter'
    ]);

    const legacyClassic = layouts.find(layout => JSON.parse(layout.schema).meta.name === 'Legacy Classic');
    const legacyHeader = JSON.parse(legacyClassic?.schema ?? '{}').sections.find(
      (section: { type: string }) => section.type === 'header'
    );
    expect(legacyHeader.blocks[0].children[0].children[0]).toMatchObject({ type: 'row', gap: 5 });
    expect(legacyHeader.blocks[1].children[1]).toMatchObject({ type: 'column', width: '50%', align: 'end' });
    expect(legacyHeader.blocks[1].children[1].children[0]).toMatchObject({
      type: 'paymentInfo',
      width: '60%',
      paymentSource: 'legacyBusiness'
    });
    expect(JSON.parse(classic?.schema ?? '{}').meta.description).toContain('bank payment information');
    expect(JSON.parse(legacyClassic?.schema ?? '{}').meta.description).toContain('Do not use for new invoices');
  });

  it('keeps existing invoice and quote snapshots isolated from layout edits', async () => {
    const originalSchema = JSON.stringify({ schemaVersion: 1, meta: { name: 'Snapshot source' }, sections: [] });
    const editedSchema = JSON.stringify({
      schemaVersion: 1,
      meta: { name: 'Snapshot source edited' },
      sections: [{ type: 'notes', visible: 'auto' }]
    });
    await db.run('INSERT INTO layouts ("schema", "isArchived") VALUES (?, ?)', [originalSchema, 0]);
    const layout = await db.get<{ id: number }>('SELECT "id" FROM layouts ORDER BY "id" DESC LIMIT 1');
    expect(layout?.id).toEqual(expect.any(Number));

    await db.run('PRAGMA foreign_keys = OFF');
    await db.run(
      `INSERT INTO invoices
        ("invoiceType", "businessId", "clientId", "currencyId", "issuedAt", "invoiceNumber", "layoutId")
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['invoice', 1, 1, 1, '2026-01-01', 'INV-1', layout?.id]
    );
    await db.run(
      `INSERT INTO invoices
        ("invoiceType", "businessId", "clientId", "currencyId", "issuedAt", "invoiceNumber", "layoutId")
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['quotation', 1, 1, 1, '2026-01-01', 'QUO-1', layout?.id]
    );
    await db.run('PRAGMA foreign_keys = ON');
    const documents = await db.all<{ id: number; invoiceType: string }>(
      'SELECT "id", "invoiceType" FROM invoices ORDER BY "id" DESC LIMIT 2'
    );
    for (const document of documents) {
      await db.run('INSERT INTO invoice_layout_snapshots ("parentInvoiceId", "layoutSchema") VALUES (?, ?)', [
        document.id,
        originalSchema
      ]);
    }

    await db.run('UPDATE layouts SET "schema" = ? WHERE "id" = ?', [editedSchema, layout?.id]);

    const snapshots = await db.all<{ parentInvoiceId: number; layoutSchema: string }>(
      'SELECT "parentInvoiceId", "layoutSchema" FROM invoice_layout_snapshots ORDER BY "parentInvoiceId"'
    );
    expect(snapshots).toHaveLength(2);
    expect(snapshots.every(snapshot => snapshot.layoutSchema === originalSchema)).toBe(true);
    expect(documents.map(document => document.invoiceType).sort()).toEqual(['invoice', 'quotation']);
  });
});
