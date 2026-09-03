import { dialog, ipcMain } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as service from '../../shared/services/layouts';
import type { DatabaseAdapter } from '../../shared/types/DatabaseAdapter';
import type { Layout } from '../../shared/types/layouts';
import { mapDatabaseError } from '../../shared/utils/errorFunctions';

export const initLayoutsHandlers = (db: DatabaseAdapter) => {
  ipcMain.handle('get-all-layouts', (_event, filter) => service.getAllLayouts(db, filter));
  ipcMain.handle('add-layout', (_event, data: Layout) => service.addLayout(db, data));
  ipcMain.handle('update-layout', (_event, data: Layout) => service.updateLayout(db, data));
  ipcMain.handle('delete-layout', (_event, id: number) => service.deleteLayout(db, id));
  ipcMain.handle('export-layout', async (_event, id: number) => {
    try {
      const layout = await service.exportLayout(db, id);
      if (!layout.success || !layout.data) return layout;

      const fileName = `${layout.data.schema.meta.name.replace(/[^a-z0-9_-]/gi, '_') || 'layout'}.json`;
      const result = await dialog.showSaveDialog({
        title: 'Export layout',
        defaultPath: join(process.env.USERPROFILE || process.cwd(), fileName),
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (result.canceled || !result.filePath) return { success: false };

      await fs.writeFile(result.filePath, JSON.stringify(layout.data.schema, null, 2), 'utf8');
      return { success: true, data: { filePath: result.filePath } };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, db.type) };
    }
  });
};
