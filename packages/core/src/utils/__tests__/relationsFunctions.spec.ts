import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import type { CategoryAdd, ItemAdd, UnitAdd } from '@invoice-builder/contracts';
import { createTestDatabase } from '../../services/__tests__/testDb';
import { addCategory } from '../../services/categories';
import { addUnit } from '../../services/units';

import type { DatabaseAdapter } from '../../types/DatabaseAdapter';

import { getOrCreateByName, resolveItemRelations } from '../relationsFunctions';

const makeUnit = (name: string): UnitAdd => ({ name, isArchived: false });

const makeCategory = (name: string): CategoryAdd => ({ name, isArchived: false });

describe('getOrCreateByName', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('returns the existing id when the row already exists', async () => {
    const added = await addUnit(db, makeUnit('Box'));
    const id = await getOrCreateByName(db, 'units', 'Box');
    expect(id).toBe(added.data?.id);
  });

  it('creates the row when missing and returns its id', async () => {
    const id = await getOrCreateByName(db, 'categories', 'Brand New');
    expect(typeof id).toBe('number');

    const secondId = await getOrCreateByName(db, 'categories', 'Brand New');
    expect(secondId).toBe(id);
  });
});

describe('resolveItemRelations', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('leaves ids untouched when already provided', async () => {
    const unit = await addUnit(db, makeUnit('Pcs'));
    const category = await addCategory(db, makeCategory('Services'));
    const item = { name: 'Item', unitId: unit.data?.id, categoryId: category.data?.id } as ItemAdd;

    const resolved = await resolveItemRelations(db, item);
    expect(resolved.unitId).toBe(unit.data?.id);
    expect(resolved.categoryId).toBe(category.data?.id);
  });

  it('resolves unitName/categoryName into ids when ids are missing', async () => {
    const item = { name: 'Item', unitName: 'Hours', categoryName: 'Consulting' } as ItemAdd;

    const resolved = await resolveItemRelations(db, item);
    expect(typeof resolved.unitId).toBe('number');
    expect(typeof resolved.categoryId).toBe('number');
  });
});
