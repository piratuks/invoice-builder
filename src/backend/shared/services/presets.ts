import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { EntityWithId } from '../types/entityWithId';
import type { FilterData } from '../types/invoiceFilter';
import type { Preset } from '../types/preset';
import type { Response } from '../types/response';
import { getDefaultValue } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';
import { getWhereClauseFromFilters } from '../utils/filterFunctions';

const presetFields: (keyof Preset)[] = [
  'name',
  'businessId',
  'clientId',
  'currencyId',
  'bankId',
  'styleProfilesId',
  'customerNotes',
  'thanksNotes',
  'termsConditionNotes',
  'language',
  'signatureData',
  'signatureSize',
  'signatureType',
  'signatureName',
  'isArchived'
];

type GetPresetsOptions = {
  id?: number;
  filter?: FilterData[];
};

const rollbackOrThrow = async (db: DatabaseAdapter) => {
  try {
    await db.run('ROLLBACK');
  } catch {
    throw new Error(`error.rollbackFailed`);
  }
};

const handleEntity =
  <T extends EntityWithId>(db: DatabaseAdapter, table: string, fields: readonly (keyof T)[]) =>
  async (data: T, isUpdate = false): Promise<Response<number>> => {
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

      return { success: true, data: lastID };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, db.type) };
    }
  };

const getPresets = async (db: DatabaseAdapter, options: GetPresetsOptions) => {
  const { id, filter } = options;

  const whereClause = filter
    ? getWhereClauseFromFilters({
        filters: filter,
        archivedColumn: 't."isArchived"'
      })
    : '';
  const conditions: string[] = [];
  if (id) conditions.push(`t."id" = ${id}`);
  if (whereClause) conditions.push(whereClause);
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
        SELECT
          t.*,
          bu."name" as "businessName",
          bu."address" as "businessAddress",
          bu."role" as "businessRole",
          bu."shortName" as "businessShortName",
          bu."email" as "businessEmail",
          bu."phone" as "businessPhone",
          bu."additional" as "businessAdditional",
          bu."logo" as "businessLogo",
          bu."fileSize" as "businessFileSize",
          bu."fileSize" as "businessFileSize",
          bu."fileType" as "businessFileType",
          bu."fileName" as "businessFileName",
          bu."vatCode" as "businessVatCode",
          cl."name" as "clientName",
          cl."address" as "clientAddress",
          cl."email" as "clientEmail",
          cl."phone" as "clientPhone",
          cl."code" as "clientCode",
          cl."additional" as "clientAdditional",
          cl."vatCode" as "clientVatCode",
          cur."code" as "currencyCode",
          cur."symbol" as "currencySymbol",
          cur."subunit" as "currencySubunit",
          cur."format" as "currencyFormat",
          ba."name" as "bankLabel",
          ba."bankName" as "bankName",
          ba."accountNumber" as "accountNumber",
          ba."swiftCode" as "swiftCode",
          ba."address" as "address",
          ba."branchCode" as "branchCode",
          ba."type" as "type",
          ba."routingNumber" as "routingNumber",
          ba."accountHolder" as "accountHolder",
          ba."sortOrder" as "sortOrder",
          ba."upiCode" as "upiCode",
          ba."qrCodeFileSize" as "qrCodeFileSize",
          ba."qrCodeFileType" as "qrCodeFileType",
          ba."qrCodeFileName" as "qrCodeFileName",
          ba."qrCode" as "qrCode",
          sp."name" as "styleProfileName",
          sp."color" as "styleProfileColor",
          sp."logoSize" as "styleProfileLogoSize",
          sp."fontSize" as "styleProfileFontSize",
          sp."fontFamily" as "styleProfileFontFamily",
          sp."layout" as "styleProfileLayout",
          sp."tableHeaderStyle" as "styleProfileTableHeaderStyle",
          sp."tableRowStyle" as "styleProfileTableRowStyle",
          sp."pageFormat" as "styleProfilePageFormat",
          sp."labelUpperCase" as "styleProfileLabelUpperCase",
          sp."showQuantity" as "styleProfileShowQuantity",
          sp."showUnit" as "styleProfileShowUnit",
          sp."showRowNo" as "styleProfileShowRowNo",
          sp."fieldSortOrders" as "styleProfileFieldSortOrders",          
          sp."pdfTexts" as "styleProfilePdfTexts",       
          sp."watermarkFileName" as "styleProfileWatermarkFileName",
          sp."watermarkFileType" as "styleProfileWatermarkFileType",
          sp."watermarkFileSize" as "styleProfileWatermarkFileSize",
          sp."watermarkFileData" as "styleProfileWatermarkFileData",
          sp."paidWatermarkFileName" as "styleProfilePaidWatermarkFileName",
          sp."paidWatermarkFileType" as "styleProfilePaidWatermarkFileType",
          sp."paidWatermarkFileSize" as "styleProfilePaidWatermarkFileSize",
          sp."paidWatermarkFileData" as "styleProfilePaidWatermarkFileData"                 
        FROM presets t
        LEFT JOIN style_profiles sp ON sp."id" = t."styleProfilesId"
        LEFT JOIN banks ba ON ba."id" = t."bankId"
        LEFT JOIN currencies cur ON cur."id" = t."currencyId"
        LEFT JOIN clients cl ON cl."id" = t."clientId"
        LEFT JOIN businesses bu ON bu."id" = t."businessId"
        ${whereSql}
        ORDER BY t."createdAt" DESC
      `;
  const presets = await db.all<Preset>(sql);
  const final = presets.map(preset => {
    return {
      ...preset,
      styleProfileFieldSortOrders:
        preset.styleProfileFieldSortOrders && typeof preset.styleProfileFieldSortOrders === 'string'
          ? JSON.parse(preset.styleProfileFieldSortOrders)
          : preset.styleProfileFieldSortOrders,
      styleProfilePdfTexts:
        preset.styleProfilePdfTexts && typeof preset.styleProfilePdfTexts === 'string'
          ? JSON.parse(preset.styleProfilePdfTexts)
          : preset.styleProfilePdfTexts
    };
  });

  return final;
};

export const getAllPresets = async (db: DatabaseAdapter, filter?: FilterData[]): Promise<Response<Preset[]>> => {
  const presets = await getPresets(db, { filter });

  return { success: true, data: presets };
};

export const addPreset = async (db: DatabaseAdapter, data: Preset): Promise<Response<Preset>> => {
  try {
    await db.run('BEGIN');

    const handle = handleEntity<Preset>(db, 'presets', presetFields);
    const result = await handle(data);

    if (!result.success || result.data == undefined) {
      await rollbackOrThrow(db);
      return { success: false, key: result.key };
    }

    await db.run('COMMIT');

    const newId = result.data;
    const newResult = await getPresets(db, { id: newId });

    return { success: true, data: newResult.length > 0 ? newResult[0] : undefined };
  } catch (error) {
    await rollbackOrThrow(db);
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const updatePreset = async (db: DatabaseAdapter, data: Preset): Promise<Response<Preset>> => {
  try {
    await db.run('BEGIN');

    const handle = handleEntity<Preset>(db, 'presets', presetFields);
    const result = await handle(data, true);

    if (!result.success || result.data == undefined) {
      await rollbackOrThrow(db);
      return { success: false, key: result.key };
    }

    await db.run('COMMIT');

    const newId = result.data;
    const newResult = await getPresets(db, { id: newId });

    return { success: true, data: newResult.length > 0 ? newResult[0] : undefined };
  } catch (error) {
    await rollbackOrThrow(db);
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const deletePreset = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM presets WHERE "id" = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const batchAddPreset = async (db: DatabaseAdapter, data: Preset[]) => {
  const handle = handleEntity<Preset>(db, 'presets', presetFields);
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
