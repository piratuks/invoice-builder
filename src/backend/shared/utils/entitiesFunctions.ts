import type { EntityWithId } from '../../shared/types/entityWithId';
import type { FilterData } from '../../shared/types/invoiceFilter';
import type { Response } from '../../shared/types/response';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { EntityWithCounts } from '../types/entityWithCounts';
import type { InvoiceAggregation } from '../types/InvoiceAggregation';
import { getDefaultValue } from './dbHelper';
import { mapDatabaseError } from './errorFunctions';

import { getHavingClauseFromFilters } from './filterFunctions';

export const getAllEntities =
  <T extends object>(
    db: DatabaseAdapter,
    table: string,
    alias: string,
    invoiceAlias: string,
    aggregation: InvoiceAggregation
  ): ((filter: FilterData[]) => Promise<Response<(T & EntityWithCounts)[]>>) =>
  async (filter: FilterData[]) => {
    const havingClause = getHavingClauseFromFilters({
      dbType: db.type,
      filters: filter,
      invoiceUpdatedAtColumn: `${invoiceAlias}."updatedAt"`,
      invoiceIdColumn: `${invoiceAlias}."id"`,
      archivedColumn: `${alias}."isArchived"`
    });

    const sql = `
      SELECT
        ${alias}.*,
        ${aggregation.invoiceCountExpr} AS "invoiceCount",
        ${aggregation.quotesCountExpr} AS "quotesCount"
      FROM ${table} ${alias}
      ${aggregation.joins}
      GROUP BY ${alias}."id"
      ${havingClause || ''}
      ORDER BY ${alias}."createdAt" DESC
    `;

    const data = await db.all<T & EntityWithCounts>(sql);

    return { success: true, data };
  };

export const handleEntity =
  <T extends EntityWithId>(
    db: DatabaseAdapter,
    table: string,
    alias: string,
    fields: readonly (keyof T)[],
    aggregation: InvoiceAggregation
  ) =>
  async (data: T, isUpdate = false): Promise<Response<T & EntityWithCounts>> => {
    const params = fields.map(key => (data[key] ?? null) as string | number | null);

    try {
      let lastID: number = -1;

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
          ${alias}.*,
          ${aggregation.invoiceCountExpr} AS "invoiceCount",
          ${aggregation.quotesCountExpr} AS "quotesCount"
        FROM ${table} ${alias}
        ${aggregation.joins}
        WHERE ${alias}."id" = ?
        GROUP BY ${alias}."id"
      `;

      const row = await db.get<T & EntityWithCounts>(sql, [lastID]);

      return { success: true, data: row ?? undefined };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, db.type) };
    }
  };
