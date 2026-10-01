import type { FilterData, Unit, UnitAdd, UnitUpdate } from '@invoice-builder/contracts';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getAllEntities, handleEntity } from '../utils/entitiesFunctions';
import { mapDatabaseError } from '../utils/errorFunctions';

const unitFields: (keyof Unit)[] = ['name', 'isArchived'];

export const getAllUnits = async (db: DatabaseAdapter, filter?: FilterData[]) => {
  const getAll = getAllEntities<Unit>(db, 'units', 'u', 'inv', {
    joins: `
      LEFT JOIN items it ON it."unitId" = u."id"
      LEFT JOIN invoice_items ii ON ii."itemId" = it."id"
      LEFT JOIN invoices inv ON ii."parentInvoiceId" = inv."id"
    `,
    invoiceCountExpr: `
      COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'invoice'
        THEN ii."parentInvoiceId" END)
    `,
    quotesCountExpr: `
      COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'quotation'
        THEN ii."parentInvoiceId" END)
    `
  });
  return getAll(filter ?? []);
};

export const addUnit = async (db: DatabaseAdapter, data: UnitAdd) => {
  const handle = handleEntity<Unit>(db, 'units', 'u', unitFields, {
    joins: `
        LEFT JOIN items it ON it."unitId" = u."id"
        LEFT JOIN invoice_items ii ON ii."itemId" = it."id"
        LEFT JOIN invoices inv ON ii."parentInvoiceId" = inv."id"
      `,
    invoiceCountExpr: `
        COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'invoice'
          THEN ii."parentInvoiceId" END)
      `,
    quotesCountExpr: `
        COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'quotation'
          THEN ii."parentInvoiceId" END)
      `
  });
  return handle(data);
};

export const updateUnit = async (db: DatabaseAdapter, data: UnitUpdate) => {
  const handle = handleEntity<Unit>(db, 'units', 'u', unitFields, {
    joins: `
        LEFT JOIN items it ON it."unitId" = u."id"
        LEFT JOIN invoice_items ii ON ii."itemId" = it."id"
        LEFT JOIN invoices inv ON ii."parentInvoiceId" = inv."id"
      `,
    invoiceCountExpr: `
        COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'invoice'
          THEN ii."parentInvoiceId" END)
      `,
    quotesCountExpr: `
        COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'quotation'
          THEN ii."parentInvoiceId" END)
      `
  });
  return handle(data, true);
};

export const deleteUnit = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM units WHERE "id" = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const batchAddUnit = async (db: DatabaseAdapter, data: UnitAdd[]) => {
  const handle = handleEntity<Unit>(db, 'units', 'u', unitFields, {
    joins: `
        LEFT JOIN items it ON it."unitId" = u."id"
        LEFT JOIN invoice_items ii ON ii."itemId" = it."id"
        LEFT JOIN invoices inv ON ii."parentInvoiceId" = inv."id"
      `,
    invoiceCountExpr: `
        COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'invoice'
          THEN ii."parentInvoiceId" END)
      `,
    quotesCountExpr: `
        COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'quotation'
          THEN ii."parentInvoiceId" END)
      `
  });
  try {
    await db.run('BEGIN');
    for (const row of data) {
      const result = await handle(row);
      if (!result.success) {
        try {
          await db.run('ROLLBACK');
        } catch {
          throw new Error(`error.rollbackFailed`);
        }
        return result;
      }
    }
    await db.run('COMMIT');
    return { success: true };
  } catch (error) {
    try {
      await db.run('ROLLBACK');
    } catch {
      throw new Error(`error.rollbackFailed`);
    }
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
