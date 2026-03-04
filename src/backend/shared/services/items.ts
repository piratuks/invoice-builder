import type { Response } from '../../shared/types/response';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { EntityWithCounts } from '../types/entityWithCounts';
import type { EntityWithId } from '../types/entityWithId';
import type { FilterData } from '../types/invoiceFilter';
import type { Item } from '../types/item';
import { getDefaultValue } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';
import { getHavingClauseFromFilters } from '../utils/filterFunctions';
import { resolveItemRelations } from '../utils/relationsFunctions';

const itemFields: (keyof Item)[] = ['name', 'amount', 'unitId', 'categoryId', 'description', 'isArchived'];

const handleItemEntity =
  <T extends EntityWithId>(db: DatabaseAdapter, table: string, fields: readonly (keyof T)[]) =>
  async (data: T, isUpdate = false): Promise<Response<T & EntityWithCounts>> => {
    const params = fields.map(key => (data[key] ?? null) as string | number | null);

    try {
      let lastID: number | void = -1;

      if (isUpdate) {
        const setClause =
          fields.map(f => `"${String(f)}" = ?`).join(', ') +
          `, "updatedAt" = ${getDefaultValue("(datetime('now'))", db.type)}`;

        await db.run(`UPDATE ${table} SET ${setClause} WHERE "id" = ?`, [...params, data.id ?? -1], true);
        lastID = data.id ?? -1;
      } else {
        lastID = await db.run(
          `INSERT INTO ${table} (${fields.map(f => `"${String(f)}"`).join(',')})
           VALUES (${fields.map(() => '?').join(',')})`,
          params,
          true
        );
      }

      const sql = `
        SELECT
            it.*,
            COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'invoice' THEN ii."parentInvoiceId" END) AS "invoiceCount",
            COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'quotation' THEN ii."parentInvoiceId" END) AS "quotesCount",
            u."name" AS "unitName",
            c."name" AS "categoryName"
        FROM items it
        LEFT JOIN units u ON it."unitId" = u."id"
        LEFT JOIN categories c ON it."categoryId" = c."id"
        LEFT JOIN invoice_items ii ON ii."itemId" = it."id"
        LEFT JOIN invoices inv ON ii."parentInvoiceId" = inv."id"
        WHERE it."id" = ?
        GROUP BY it."id", u."name", c."name"
        ORDER BY it."createdAt" DESC
      `;

      const row = await db.get<T & EntityWithCounts>(sql, [lastID]);

      return { success: true, data: row ?? undefined };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, db.type) };
    }
  };

export const getAllItemEntities =
  <T extends object>(db: DatabaseAdapter): ((filter: FilterData[]) => Promise<Response<(T & EntityWithCounts)[]>>) =>
  async (filter: FilterData[]) => {
    const havingClause = getHavingClauseFromFilters({
      dbType: db.type,
      filters: filter ?? [],
      invoiceUpdatedAtColumn: 'inv."updatedAt"',
      invoiceIdColumn: 'inv."id"',
      archivedColumn: 'it."isArchived"'
    });

    const sql = `
      SELECT
          it.*,
          COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'invoice' THEN ii."parentInvoiceId" END) AS "invoiceCount",
          COUNT(DISTINCT CASE WHEN inv."invoiceType" = 'quotation' THEN ii."parentInvoiceId" END) AS "quotesCount",
          u."name" AS "unitName",
          c."name" AS "categoryName"
      FROM items it
      LEFT JOIN units u ON it."unitId" = u."id"
      LEFT JOIN categories c ON it."categoryId" = c."id"
      LEFT JOIN invoice_items ii ON ii."itemId" = it."id"
      LEFT JOIN invoices inv ON ii."parentInvoiceId" = inv."id"
      GROUP BY it."id", u."name", c."name"
      ${havingClause ? havingClause : ''}
      ORDER BY it."createdAt" DESC
    `;

    const data = await db.all<T & EntityWithCounts>(sql);

    return { success: true, data };
  };

export const getAllItems = async (db: DatabaseAdapter, filter?: FilterData[]) => {
  const getAll = await getAllItemEntities(db);
  return getAll(filter ?? []);
};

export const addItem = async (db: DatabaseAdapter, data: Item) => {
  const handle = handleItemEntity<Item>(db, 'items', itemFields);
  return handle(data);
};

export const updateItem = async (db: DatabaseAdapter, data: Item) => {
  const handle = handleItemEntity<Item>(db, 'items', itemFields);
  return handle(data, true);
};

export const deleteItem = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM items WHERE "id" = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const batchAddItem = async (db: DatabaseAdapter, data: Item[]) => {
  const handle = handleItemEntity<Item>(db, 'items', itemFields);
  try {
    await db.run('BEGIN');
    for (const row of data) {
      const finalItem = await resolveItemRelations(db, row);
      const result = await handle(finalItem);
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
