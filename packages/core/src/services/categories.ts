import type { Category, CategoryAdd, CategoryUpdate, FilterData } from '@invoice-builder/contracts';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getAllEntities, handleEntity } from '../utils/entitiesFunctions';
import { mapDatabaseError } from '../utils/errorFunctions';

const categoryFields: (keyof Category)[] = ['name', 'isArchived'];

export const getAllCategories = async (db: DatabaseAdapter, filter?: FilterData[]) => {
  const getAll = getAllEntities<Category>(db, 'categories', 'c', 'inv', {
    joins: `
        LEFT JOIN items it ON it."categoryId" = c."id"
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

export const addCategory = async (db: DatabaseAdapter, data: CategoryAdd) => {
  const handle = handleEntity<Category>(db, 'categories', 'c', categoryFields, {
    joins: `
          LEFT JOIN items it ON it."categoryId" = c."id"
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

export const updateCategory = async (db: DatabaseAdapter, data: CategoryUpdate) => {
  const handle = handleEntity<Category>(db, 'categories', 'c', categoryFields, {
    joins: `
          LEFT JOIN items it ON it."categoryId" = c."id"
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

export const deleteCategory = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM categories WHERE "id" = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const batchAddCategory = async (db: DatabaseAdapter, data: CategoryAdd[]) => {
  const handle = handleEntity<Category>(db, 'categories', 'c', categoryFields, {
    joins: `
          LEFT JOIN items it ON it."categoryId" = c."id"
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
