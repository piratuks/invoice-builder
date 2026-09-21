import { addBank, batchAddBank, deleteBank, getAllBanks, updateBank } from '../shared/services/banks';
import {
  addBusiness,
  batchAddBusiness,
  deleteBusiness,
  getAllBusinesses,
  updateBusiness
} from '../shared/services/businesses';
import {
  addCategory,
  batchAddCategory,
  deleteCategory,
  getAllCategories,
  updateCategory
} from '../shared/services/categories';
import { addClient, batchAddClient, deleteClient, getAllClients, updateClient } from '../shared/services/clients';
import {
  addCurrency,
  batchAddCurrency,
  deleteCurrency,
  getAllCurrencies,
  updateCurrency
} from '../shared/services/currencies';
import { addUnit, batchAddUnit, deleteUnit, getAllUnits, updateUnit } from '../shared/services/units';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';
import type { Bank } from '../shared/types/bank';
import type { Business } from '../shared/types/business';
import type { Category } from '../shared/types/category';
import type { Client } from '../shared/types/client';
import type { Currency } from '../shared/types/currency';
import type { Unit } from '../shared/types/unit';
import { createTestDatabase } from './testDb';

const timestamps = () => ({ createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

const makeBank = (overrides: Partial<Bank> = {}): Bank => ({
  name: 'Bank',
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

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  name: 'Category',
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

const makeCurrency = (overrides: Partial<Currency> = {}): Currency => ({
  code: 'XXX',
  symbol: 'X',
  text: 'Currency',
  format: '#',
  subunit: 100,
  isArchived: false,
  invoiceCount: 0,
  quotesCount: 0,
  ...timestamps(),
  ...overrides
});

const makeUnit = (overrides: Partial<Unit> = {}): Unit => ({
  name: 'Unit',
  isArchived: false,
  invoiceCount: 0,
  quotesCount: 0,
  ...timestamps(),
  ...overrides
});

describe('generic CRUD entity services', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('banks', () => {
    it('adds, lists, updates and deletes a bank', async () => {
      const addResult = await addBank(db, makeBank({ name: 'Bank A' }));
      expect(addResult.success).toBe(true);
      expect(addResult.data?.id).toBeDefined();
      const id = addResult.data!.id as unknown as number;

      const listResult = await getAllBanks(db);
      expect(listResult.success).toBe(true);
      expect(listResult.data?.some(b => b.id === id)).toBe(true);

      const updateResult = await updateBank(db, makeBank({ id, name: 'Bank A Updated' }));
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.name).toBe('Bank A Updated');

      const deleteResult = await deleteBank(db, id);
      expect(deleteResult.success).toBe(true);

      const listAfterDelete = await getAllBanks(db);
      expect(listAfterDelete.data?.some(b => b.id === id)).toBe(false);
    });

    it('batch adds banks and rolls back on constraint violation', async () => {
      const batchResult = await batchAddBank(db, [makeBank({ name: 'Bank B' }), makeBank({ name: 'Bank C' })]);
      expect(batchResult.success).toBe(true);

      const failedBatch = await batchAddBank(db, [makeBank({ name: 'Bank D' }), makeBank({ name: 'Bank B' })]);
      expect(failedBatch.success).toBe(false);

      const listResult = await getAllBanks(db);
      expect(listResult.data?.some(b => b.name === 'Bank D')).toBe(false);
    });
  });

  describe('businesses', () => {
    it('adds, lists, updates and deletes a business', async () => {
      const addResult = await addBusiness(db, makeBusiness({ name: 'Biz A', shortName: 'BA' }));
      expect(addResult.success).toBe(true);
      const id = addResult.data!.id as unknown as number;

      const listResult = await getAllBusinesses(db);
      expect(listResult.data?.some(b => b.id === id)).toBe(true);

      const updateResult = await updateBusiness(db, makeBusiness({ id, name: 'Biz A Updated', shortName: 'BA' }));
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.name).toBe('Biz A Updated');

      const deleteResult = await deleteBusiness(db, id);
      expect(deleteResult.success).toBe(true);
    });

    it('batch adds businesses', async () => {
      const batchResult = await batchAddBusiness(db, [
        makeBusiness({ name: 'Biz B', shortName: 'BB' }),
        makeBusiness({ name: 'Biz C', shortName: 'BC' })
      ]);
      expect(batchResult.success).toBe(true);
    });
  });

  describe('categories', () => {
    it('adds, lists, updates and deletes a category', async () => {
      const addResult = await addCategory(db, makeCategory({ name: 'Category A' }));
      expect(addResult.success).toBe(true);
      const id = addResult.data!.id as unknown as number;

      const listResult = await getAllCategories(db);
      expect(listResult.data?.some(c => c.id === id)).toBe(true);

      const updateResult = await updateCategory(db, makeCategory({ id, name: 'Category A Updated' }));
      expect(updateResult.success).toBe(true);

      const deleteResult = await deleteCategory(db, id);
      expect(deleteResult.success).toBe(true);
    });

    it('batch adds categories and rolls back on constraint violation', async () => {
      const okBatch = await batchAddCategory(db, [makeCategory({ name: 'Category B' })]);
      expect(okBatch.success).toBe(true);

      const badBatch = await batchAddCategory(db, [
        makeCategory({ name: 'Category C' }),
        makeCategory({ name: 'Category B' })
      ]);
      expect(badBatch.success).toBe(false);
    });
  });

  describe('clients', () => {
    it('adds, lists, updates and deletes a client', async () => {
      const addResult = await addClient(db, makeClient({ name: 'Client A', shortName: 'CA' }));
      expect(addResult.success).toBe(true);
      const id = addResult.data!.id as unknown as number;

      const listResult = await getAllClients(db);
      expect(listResult.data?.some(c => c.id === id)).toBe(true);

      const updateResult = await updateClient(db, makeClient({ id, name: 'Client A Updated', shortName: 'CA' }));
      expect(updateResult.success).toBe(true);

      const deleteResult = await deleteClient(db, id);
      expect(deleteResult.success).toBe(true);
    });

    it('batch adds clients', async () => {
      const batchResult = await batchAddClient(db, [
        makeClient({ name: 'Client B', shortName: 'CB' }),
        makeClient({ name: 'Client C', shortName: 'CC' })
      ]);
      expect(batchResult.success).toBe(true);
    });
  });

  describe('currencies', () => {
    it('adds, lists, updates and deletes a currency', async () => {
      const addResult = await addCurrency(db, makeCurrency({ code: 'XYZ', symbol: 'X', text: 'Xylo' }));
      expect(addResult.success).toBe(true);
      const id = addResult.data!.id as unknown as number;

      const listResult = await getAllCurrencies(db);
      expect(listResult.data?.some(c => c.id === id)).toBe(true);

      const updateResult = await updateCurrency(db, makeCurrency({ id, code: 'XYZ', symbol: 'X2', text: 'Xylo' }));
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.symbol).toBe('X2');

      const deleteResult = await deleteCurrency(db, id);
      expect(deleteResult.success).toBe(true);
    });

    it('batch adds currencies and rolls back on constraint violation', async () => {
      const okBatch = await batchAddCurrency(db, [makeCurrency({ code: 'AAA', symbol: 'A', text: 'Alpha' })]);
      expect(okBatch.success).toBe(true);

      const badBatch = await batchAddCurrency(db, [
        makeCurrency({ code: 'BBB', symbol: 'B', text: 'Beta' }),
        makeCurrency({ code: 'AAA', symbol: 'A2', text: 'Alpha2' })
      ]);
      expect(badBatch.success).toBe(false);
    });
  });

  describe('units', () => {
    it('adds, lists, updates and deletes a unit', async () => {
      const addResult = await addUnit(db, makeUnit({ name: 'Unit A' }));
      expect(addResult.success).toBe(true);
      const id = addResult.data!.id as unknown as number;

      const listResult = await getAllUnits(db);
      expect(listResult.data?.some(u => u.id === id)).toBe(true);

      const updateResult = await updateUnit(db, makeUnit({ id, name: 'Unit A Updated' }));
      expect(updateResult.success).toBe(true);

      const deleteResult = await deleteUnit(db, id);
      expect(deleteResult.success).toBe(true);
    });

    it('batch adds units and rolls back on constraint violation', async () => {
      const okBatch = await batchAddUnit(db, [makeUnit({ name: 'Unit B' })]);
      expect(okBatch.success).toBe(true);

      const badBatch = await batchAddUnit(db, [makeUnit({ name: 'Unit C' }), makeUnit({ name: 'Unit B' })]);
      expect(badBatch.success).toBe(false);
    });
  });
});
