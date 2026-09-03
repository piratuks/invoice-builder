import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getTableColumns } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    const columns = await getTableColumns(db, 'style_profiles');
    if (!columns.some(column => column.name === 'layoutId')) {
      await db.run('ALTER TABLE style_profiles ADD COLUMN "layoutId" INTEGER REFERENCES layouts("id")');
      await db.run('CREATE INDEX IF NOT EXISTS idx_style_profiles_layoutId ON style_profiles("layoutId")');
    }

    await db.run(`
      UPDATE style_profiles
      SET "layoutId" = (
        SELECT layouts."id"
        FROM layouts
        WHERE layouts."schema" LIKE '%' || '"name":"' || CASE COALESCE(style_profiles."layout", 'classic')
          WHEN 'modern' THEN 'Modern'
          WHEN 'compact' THEN 'Compact'
          ELSE 'Classic'
        END || '"%'
        LIMIT 1
      )
      WHERE "layoutId" IS NULL
    `);

    if (columns.some(column => column.name === 'layout')) {
      await db.run('ALTER TABLE style_profiles DROP COLUMN "layout"');
    }

    await db.run('ALTER TABLE invoice_customizations DROP COLUMN "layout"');
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
