import sqlite3 from 'sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSqliteAdapter } from '../shared/db/client';
import { initSchema } from '../shared/db/setup';
import { up as createLayouts } from '../shared/migrations/20260902-27-invoice_layouts';
import { up as seedLayouts } from '../shared/migrations/20260902-28-layout-schema-seeds';
import { up as repairLayoutSchemas } from '../shared/migrations/20260915-30-layout-schema-repair';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';

type LayoutRow = { id: number; schema: string; isArchived: number };

describe('layout schema migrations', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = createSqliteAdapter(new sqlite3.Database(':memory:'));
    await initSchema(db);
  });

  it('creates schema storage and seeds active and archived built-in layouts idempotently', async () => {
    await createLayouts(db);
    await seedLayouts(db);
    await seedLayouts(db);

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

  it('repairs logo and business spacing in layouts and invoice snapshots', async () => {
    await createLayouts(db);
    const schema = JSON.stringify({
      schemaVersion: 1,
      meta: { name: 'Classic' },
      sections: [
        {
          type: 'header',
          visible: true,
          blocks: [{ type: 'row', children: [{ type: 'logo' }, { type: 'businessInfo' }] }]
        }
      ]
    });
    await db.run('INSERT INTO layouts ("schema", "isArchived") VALUES (?, ?)', [schema, 0]);
    await db.run('PRAGMA foreign_keys = OFF');
    await db.run('INSERT INTO invoice_layout_snapshots ("parentInvoiceId", "layoutSchema") VALUES (?, ?)', [
      42,
      schema
    ]);
    await db.run('PRAGMA foreign_keys = ON');

    await repairLayoutSchemas(db);

    const layout = await db.get<{ schema: string }>('SELECT "schema" FROM layouts ORDER BY "id" DESC LIMIT 1');
    const snapshot = await db.get<{ layoutSchema: string }>(
      'SELECT "layoutSchema" FROM invoice_layout_snapshots WHERE "parentInvoiceId" = ?',
      [42]
    );
    const readRow = (value: string) => JSON.parse(value).sections[0].blocks[0];

    expect(readRow(layout?.schema ?? '{}')).toMatchObject({
      gap: 5,
      children: [{ type: 'logo' }, { type: 'businessInfo', width: '50%' }]
    });
    expect(readRow(snapshot?.layoutSchema ?? '{}')).toEqual(readRow(layout?.schema ?? '{}'));
  });

  it('keeps existing invoice and quote snapshots isolated from layout edits', async () => {
    await createLayouts(db);
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
        ("invoiceType", "businessId", "clientId", "currencyId", "issuedAt", "invoiceNumber",
         "businessNameSnapshot", "businessShortNameSnapshot", "clientNameSnapshot",
         "currencyCodeSnapshot", "currencySymbolSnapshot", "currencySubunitSnapshot", "layoutId")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['invoice', 1, 1, 1, '2026-01-01', 'INV-1', 'Business', 'BU', 'Client', 'EUR', '€', 2, layout?.id]
    );
    await db.run(
      `INSERT INTO invoices
        ("invoiceType", "businessId", "clientId", "currencyId", "issuedAt", "invoiceNumber",
         "businessNameSnapshot", "businessShortNameSnapshot", "clientNameSnapshot",
         "currencyCodeSnapshot", "currencySymbolSnapshot", "currencySubunitSnapshot", "layoutId")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['quotation', 1, 1, 1, '2026-01-01', 'QUO-1', 'Business', 'BU', 'Client', 'EUR', '€', 2, layout?.id]
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
