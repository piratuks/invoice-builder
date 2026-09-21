import { AmountFormat } from '../../enums/amountFormat';
import { DatabaseType } from '../../enums/databaseType';
import { DateFormat } from '../../enums/dateFormat';
import { Language } from '../../enums/language';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';
import type { Business } from '../../types/business';
import type { Category } from '../../types/category';
import type { Client } from '../../types/client';
import type { EntityWithCounts } from '../../types/entityWithCounts';
import type { Item } from '../../types/item';
import type { Layout } from '../../types/layouts';
import type { Preset } from '../../types/preset';
import type { Settings } from '../../types/settings';
import type { StyleProfile } from '../../types/styleProfiles';
import type { Unit } from '../../types/unit';
import { addBusiness } from '../businesses';
import { addCategory } from '../categories';
import { addClient } from '../clients';
import { exportAllData, importAllData } from '../importExport';
import { addItem, batchAddItem, deleteItem, getAllItems, updateItem } from '../items';
import { addLayout, deleteLayout, exportLayout, getAllLayouts, updateLayout } from '../layouts';
import { addPreset, batchAddPreset, deletePreset, getAllPresets, updatePreset } from '../presets';
import { getAllSettings, updateSettings } from '../settings';
import {
  addStyleProfile,
  batchAddStyleProfile,
  deleteStyleProfile,
  getAllStyleProfiles,
  updateStyleProfile
} from '../styleProfiles';
import { addUnit } from '../units';
import { createTestDatabase } from './testDb';

const timestamps = () => ({ createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

const makeUnit = (overrides: Partial<Unit> = {}): Unit => ({
  name: 'Unit',
  isArchived: false,
  invoiceCount: 0,
  quotesCount: 0,
  ...timestamps(),
  ...overrides
});

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  name: 'Category',
  isArchived: false,
  invoiceCount: 0,
  quotesCount: 0,
  ...timestamps(),
  ...overrides
});

const makeBusiness = (overrides: Partial<Business> = {}): Business => ({
  name: 'Business',
  shortName: 'BIZ',
  isArchived: false,
  invoiceCount: 0,
  quotesCount: 0,
  ...timestamps(),
  ...overrides
});

const makeClient = (overrides: Partial<Client> = {}): Client => ({
  name: 'Client',
  shortName: 'CLI',
  isArchived: false,
  invoiceCount: 0,
  quotesCount: 0,
  ...timestamps(),
  ...overrides
});

const makeItem = (overrides: Partial<Item> = {}): Item => ({
  name: 'Item',
  isArchived: false,
  invoiceCount: 0,
  quotesCount: 0,
  ...timestamps(),
  ...overrides
});

const makePreset = (overrides: Partial<Preset> = {}): Preset => ({
  name: 'Preset',
  isArchived: false,
  ...timestamps(),
  ...overrides
});

// Layout schema and StyleProfile sort-order shapes below are deliberately loose test fixtures,
// so they are cast via `unknown` rather than built as fully valid domain objects.
const makeSettings = (overrides: Partial<Settings> = {}): Settings => ({
  id: 1,
  language: Language.en,
  amountFormat: AmountFormat.enUS,
  dateFormat: DateFormat.MMddyyyy,
  isDarkMode: false,
  shouldIncludeYear: true,
  shouldIncludeMonth: true,
  shouldIncludeBusinessName: true,
  quotesON: false,
  styleProfilesON: false,
  ublON: false,
  xrechnungON: false,
  presetsON: false,
  reportsON: false,
  receiptPrintingOn: false,
  ...timestamps(),
  ...overrides
});

describe('settings service', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('retrieves the singleton settings row', async () => {
    const result = await getAllSettings(db);
    expect(result.success).toBe(true);
    expect(result.data).toBeTruthy();
  });

  it('updates settings fields', async () => {
    const result = await updateSettings(db, makeSettings({ language: Language.fr }));
    expect(result.success).toBe(true);

    const after = await getAllSettings(db);
    expect((after.data as Settings | null)?.language).toBe('fr');
  });

  it('is a no-op when no fields provided', async () => {
    const result = await updateSettings(db, {} as unknown as Settings);
    expect(result.success).toBe(true);
  });
});

describe('layouts service', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds, lists, exports, updates and deletes a layout', async () => {
    const addResult = await addLayout(db, { schema: { blocks: [] }, isArchived: false } as unknown as Layout);
    expect(addResult.success).toBe(true);
    const id = addResult.data!.id as unknown as number;
    expect(addResult.data?.schema).toEqual({ blocks: [] });

    const listResult = await getAllLayouts(db);
    expect(listResult.data?.some(l => l.id === id)).toBe(true);

    const exportResult = await exportLayout(db, id);
    expect(exportResult.success).toBe(true);
    expect((exportResult.data as Layout | undefined)?.schema).toEqual({ blocks: [] });

    const updateResult = await updateLayout(db, {
      id,
      schema: { blocks: ['a'] },
      isArchived: false
    } as unknown as Layout);
    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.schema).toEqual({ blocks: ['a'] });

    const deleteResult = await deleteLayout(db, id);
    expect(deleteResult.success).toBe(true);
  });
});

describe('styleProfiles service', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds, lists, updates and deletes a style profile', async () => {
    const addResult = await addStyleProfile(db, {
      name: 'Profile A',
      isArchived: false,
      fieldSortOrders: ['name'],
      pdfTexts: {},
      showQuantity: true,
      showUnit: true,
      showRowNo: true,
      labelUpperCase: false
    } as unknown as StyleProfile);
    expect(addResult.success).toBe(true);
    const id = addResult.data!.id as unknown as number;
    expect(Array.isArray(addResult.data?.fieldSortOrders)).toBe(true);

    const listResult = await getAllStyleProfiles(db);
    expect(listResult.data?.some(p => p.id === id)).toBe(true);

    const updateResult = await updateStyleProfile(db, {
      id,
      name: 'Profile A Updated',
      isArchived: false,
      fieldSortOrders: ['name'],
      pdfTexts: {},
      showQuantity: true,
      showUnit: true,
      showRowNo: true,
      labelUpperCase: false
    } as unknown as StyleProfile);
    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.name).toBe('Profile A Updated');

    const deleteResult = await deleteStyleProfile(db, id);
    expect(deleteResult.success).toBe(true);
  });

  it('batch adds style profiles and rolls back on constraint violation', async () => {
    const okBatch = await batchAddStyleProfile(db, [
      {
        name: 'Profile B',
        isArchived: false,
        fieldSortOrders: [],
        pdfTexts: {},
        showQuantity: true,
        showUnit: true,
        showRowNo: true,
        labelUpperCase: false
      }
    ] as unknown as StyleProfile[]);
    expect(okBatch.success).toBe(true);

    const badBatch = await batchAddStyleProfile(db, [
      {
        name: 'Profile C',
        isArchived: false,
        fieldSortOrders: [],
        pdfTexts: {},
        showQuantity: true,
        showUnit: true,
        showRowNo: true,
        labelUpperCase: false
      },
      {
        name: 'Profile B',
        isArchived: false,
        fieldSortOrders: [],
        pdfTexts: {},
        showQuantity: true,
        showUnit: true,
        showRowNo: true,
        labelUpperCase: false
      }
    ] as unknown as StyleProfile[]);
    expect(badBatch.success).toBe(false);
  });
});

describe('items service', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds, lists, updates and deletes an item', async () => {
    const unit = await addUnit(db, makeUnit({ name: 'Box' }));
    const category = await addCategory(db, makeCategory({ name: 'Goods' }));

    const addResult = await addItem(
      db,
      makeItem({ name: 'Item A', amount: '100', unitId: unit.data?.id, categoryId: category.data?.id })
    );
    expect(addResult.success).toBe(true);
    const id = addResult.data!.id as unknown as number;

    const listResult = await getAllItems(db);
    const items = listResult.data as (Item & EntityWithCounts)[] | undefined;
    expect(items?.some(i => i.id === id)).toBe(true);

    const updateResult = await updateItem(db, makeItem({ id, name: 'Item A Updated', amount: '150' }));
    expect(updateResult.success).toBe(true);

    const deleteResult = await deleteItem(db, id);
    expect(deleteResult.success).toBe(true);
  });

  it('batch adds items', async () => {
    const batchResult = await batchAddItem(db, [
      makeItem({ name: 'Item B', amount: '10' }),
      makeItem({ name: 'Item C', amount: '20' })
    ]);
    expect(batchResult.success).toBe(true);
  });
});

describe('presets service', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds, lists, updates and deletes a preset', async () => {
    const business = await addBusiness(db, makeBusiness({ name: 'Preset Biz', shortName: 'PB' }));
    const client = await addClient(db, makeClient({ name: 'Preset Client', shortName: 'PC' }));

    const addResult = await addPreset(
      db,
      makePreset({ name: 'Preset A', businessId: business.data?.id, clientId: client.data?.id })
    );
    expect(addResult.success).toBe(true);
    const id = addResult.data!.id as unknown as number;

    const listResult = await getAllPresets(db);
    expect(listResult.data?.some(p => p.id === id)).toBe(true);

    const updateResult = await updatePreset(db, makePreset({ id, name: 'Preset A Updated' }));
    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.name).toBe('Preset A Updated');

    const deleteResult = await deletePreset(db, id);
    expect(deleteResult.success).toBe(true);
  });

  it('batch adds presets and rolls back on constraint violation', async () => {
    const okBatch = await batchAddPreset(db, [makePreset({ name: 'Preset B' })]);
    expect(okBatch.success).toBe(true);

    const badBatch = await batchAddPreset(db, [makePreset({ name: 'Preset C' }), makePreset({ name: 'Preset B' })]);
    expect(badBatch.success).toBe(false);
  });
});

describe('importExport service', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('exports all data including newly added entities', async () => {
    await addBusiness(db, makeBusiness({ name: 'Export Biz', shortName: 'EB' }));
    await addPreset(db, makePreset({ name: 'Export Preset' }));

    const result = await exportAllData(db);
    expect(result.success).toBe(true);
    expect(result.data?.businesses.length).toBe(1);
  });

  it('rejects invalid import payloads', async () => {
    const result = await importAllData(db, null as unknown as Record<string, unknown>);
    expect(result.success).toBe(false);
  });

  it('imports a previously exported payload', async () => {
    await addBusiness(db, makeBusiness({ name: 'RoundTrip Biz', shortName: 'RB' }));
    await addPreset(db, makePreset({ name: 'RoundTrip Preset' }));
    const exported = await exportAllData(db);
    expect(exported.success).toBe(true);

    const result = await importAllData(db, exported.data as unknown as Record<string, unknown>);
    expect(result.success).toBe(true);

    const reExported = await exportAllData(db);
    expect(reExported.data?.businesses.some(b => b?.name === 'RoundTrip Biz')).toBe(true);
    expect(reExported.data?.presets.some(p => p?.name === 'RoundTrip Preset')).toBe(true);
  });

  it('accepts an empty object and restores SQLite foreign keys', async () => {
    const result = await importAllData(db, {});

    expect(result).toEqual({ success: true });
    expect(await db.get('PRAGMA foreign_keys')).toMatchObject({ foreign_keys: 1 });
  });

  it('uses PostgreSQL identity inserts and updates non-id settings fields', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const postgresDb = { type: DatabaseType.postgre, run } as unknown as DatabaseAdapter;

    const result = await importAllData(postgresDb, {
      currencies: [{}, { invoiceFullNumber: 'ignored' }, { id: 9, code: 'TST', isArchived: true }],
      settings: { id: 1, isDarkMode: false }
    });

    expect(result).toEqual({ success: true });
    expect(run.mock.calls.some(([sql]) => String(sql).includes('OVERRIDING SYSTEM VALUE'))).toBe(true);
    expect(run.mock.calls.some(([sql]) => String(sql).includes('SELECT setval'))).toBe(true);
    expect(run).toHaveBeenCalledWith(expect.stringContaining('UPDATE settings SET'), [0]);
  });

  it('rolls back failed imports and restores SQLite foreign keys', async () => {
    const run = vi.fn(async (sql: string) => {
      if (sql === 'DELETE FROM invoices') throw new Error('delete failed');
    });
    const failingDb = { type: DatabaseType.sqlite, run } as unknown as DatabaseAdapter;

    await expect(importAllData(failingDb, {})).resolves.toMatchObject({ success: false });
    expect(run).toHaveBeenCalledWith('ROLLBACK');
    expect(run).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
  });

  it('reports rollback failures', async () => {
    const run = vi.fn(async (sql: string) => {
      if (sql === 'ROLLBACK') throw new Error('rollback failed');
      if (sql === 'DELETE FROM invoices') throw new Error('delete failed');
    });
    const failingDb = { type: DatabaseType.sqlite, run } as unknown as DatabaseAdapter;

    await expect(importAllData(failingDb, {})).resolves.toMatchObject({ success: false });
  });
});
