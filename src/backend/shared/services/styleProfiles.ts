import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { EntityWithCounts } from '../types/entityWithCounts';
import type { FilterData } from '../types/invoiceFilter';
import type { Response } from '../types/response';
import type { StyleProfile } from '../types/styleProfiles';
import { getAllEntities, handleEntity } from '../utils/entitiesFunctions';
import { mapDatabaseError } from '../utils/errorFunctions';

const styleProfileFields: (keyof StyleProfile)[] = [
  'name',
  'color',
  'logoSize',
  'fontSize',
  'fontFamily',
  'layoutId',
  'tableHeaderStyle',
  'tableRowStyle',
  'pageFormat',
  'labelUpperCase',
  'watermarkFileName',
  'watermarkFileType',
  'watermarkFileSize',
  'watermarkFileData',
  'paidWatermarkFileName',
  'paidWatermarkFileType',
  'paidWatermarkFileSize',
  'paidWatermarkFileData',
  'isArchived',
  'showQuantity',
  'showUnit',
  'showRowNo',
  'fieldSortOrders',
  'pdfTexts'
];

export const getAllStyleProfiles = async (
  db: DatabaseAdapter,
  filter?: FilterData[]
): Promise<Response<(StyleProfile & EntityWithCounts)[]>> => {
  const getAll = getAllEntities<StyleProfile>(db, 'style_profiles', 't', 'i', {
    joins: `
          LEFT JOIN invoices i ON i."styleProfilesId" = t."id"
        `,
    invoiceCountExpr: `
          COUNT(DISTINCT CASE WHEN i."invoiceType" = 'invoice'
            THEN i."id" END)
        `,
    quotesCountExpr: `
          COUNT(DISTINCT CASE WHEN i."invoiceType" = 'quotation'
            THEN i."id" END)
        `
  });

  const result = await getAll(filter ?? []);
  const layouts = await db.all<{ id: number; schema: string }>('SELECT "id", "schema" FROM layouts');
  const layoutSchemas = new Map(layouts.map(layout => [layout.id, JSON.parse(layout.schema)]));
  result.data = result.data
    ? result.data?.map(profile => {
        return {
          ...profile,
          layoutSchema: profile.layoutId === undefined ? undefined : layoutSchemas.get(profile.layoutId),
          fieldSortOrders:
            profile.fieldSortOrders && typeof profile.fieldSortOrders === 'string'
              ? JSON.parse(profile.fieldSortOrders)
              : profile.fieldSortOrders,
          pdfTexts:
            profile.pdfTexts && typeof profile.pdfTexts === 'string' ? JSON.parse(profile.pdfTexts) : profile.pdfTexts
        };
      })
    : result.data;
  return result;
};

export const addStyleProfile = async (
  db: DatabaseAdapter,
  data: StyleProfile
): Promise<Response<StyleProfile & EntityWithCounts>> => {
  const handle = handleEntity<StyleProfile>(db, 'style_profiles', 'sp', styleProfileFields, {
    joins: `LEFT JOIN invoices i ON i."styleProfilesId" = sp."id"`,
    invoiceCountExpr: `
          COUNT(DISTINCT CASE WHEN i."invoiceType" = 'invoice'
            THEN i."id" END)
        `,
    quotesCountExpr: `
          COUNT(DISTINCT CASE WHEN i."invoiceType" = 'quotation'
            THEN i."id" END)
        `
  });
  const result = await handle({
    ...data,
    fieldSortOrders: JSON.stringify(data.fieldSortOrders),
    pdfTexts: JSON.stringify(data.pdfTexts)
  });
  result.data = result.data
    ? {
        ...result.data,
        fieldSortOrders:
          result.data.fieldSortOrders && typeof result.data.fieldSortOrders === 'string'
            ? JSON.parse(result.data.fieldSortOrders)
            : result.data.fieldSortOrders,
        pdfTexts:
          result.data.pdfTexts && typeof result.data.pdfTexts === 'string'
            ? JSON.parse(result.data.pdfTexts)
            : result.data.pdfTexts
      }
    : result.data;
  return result;
};

export const updateStyleProfile = async (
  db: DatabaseAdapter,
  data: StyleProfile
): Promise<Response<StyleProfile & EntityWithCounts>> => {
  const handle = handleEntity<StyleProfile>(db, 'style_profiles', 'sp', styleProfileFields, {
    joins: `LEFT JOIN invoices i ON i."styleProfilesId" = sp."id"`,
    invoiceCountExpr: `
          COUNT(DISTINCT CASE WHEN i."invoiceType" = 'invoice'
            THEN i."id" END)
        `,
    quotesCountExpr: `
          COUNT(DISTINCT CASE WHEN i."invoiceType" = 'quotation'
            THEN i."id" END)
        `
  });
  const result = await handle(
    {
      ...data,
      fieldSortOrders: JSON.stringify(data.fieldSortOrders),
      pdfTexts: JSON.stringify(data.pdfTexts)
    },
    true
  );
  result.data = result.data
    ? {
        ...result.data,
        fieldSortOrders:
          result.data.fieldSortOrders && typeof result.data.fieldSortOrders === 'string'
            ? JSON.parse(result.data.fieldSortOrders)
            : result.data.fieldSortOrders,
        pdfTexts:
          result.data.pdfTexts && typeof result.data.pdfTexts === 'string'
            ? JSON.parse(result.data.pdfTexts)
            : result.data.pdfTexts
      }
    : result.data;
  return result;
};

export const deleteStyleProfile = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM style_profiles WHERE "id" = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const batchAddStyleProfile = async (db: DatabaseAdapter, data: StyleProfile[]) => {
  const handle = handleEntity<StyleProfile>(db, 'style_profiles', 'sp', styleProfileFields, {
    joins: `LEFT JOIN invoices i ON i."styleProfilesId" = sp."id"`,
    invoiceCountExpr: `
          COUNT(DISTINCT CASE WHEN i."invoiceType" = 'invoice'
            THEN i."id" END)
        `,
    quotesCountExpr: `
          COUNT(DISTINCT CASE WHEN i."invoiceType" = 'quotation'
            THEN i."id" END)
        `
  });
  try {
    await db.run('BEGIN');
    for (const row of data) {
      const result = await handle({
        ...row,
        fieldSortOrders:
          typeof row.fieldSortOrders === 'string' ? row.fieldSortOrders : JSON.stringify(row.fieldSortOrders),
        pdfTexts: typeof row.pdfTexts === 'string' ? row.pdfTexts : JSON.stringify(row.pdfTexts)
      });
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
