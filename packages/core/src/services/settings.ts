import type { SettingsUpdate } from '@invoice-builder/contracts';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';

import { getDefaultValue, prepareUpdate } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const getAllSettings = async (db: DatabaseAdapter) => {
  const row = await db.get('SELECT * FROM settings LIMIT 1');

  if (!row) return { success: true, data: null };
  return { success: true, data: row };
};

export const updateSettings = async (
  db: DatabaseAdapter,
  data: SettingsUpdate & { id?: number; createdAt?: string; updatedAt?: string }
) => {
  try {
    const { createdAt, updatedAt, id, ...rest } = data;
    void createdAt;
    void updatedAt;
    void id;

    const { fields, params } = prepareUpdate(rest);
    if (!fields.length) return { success: true };

    fields.push(`"updatedAt" = ${getDefaultValue("datetime('now')", db.type)}`);

    await db.run(`UPDATE settings SET ${fields.join(', ')} WHERE id = (SELECT "id" FROM settings LIMIT 1)`, params);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
