import { dialog, ipcMain } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as importExportService from '../../shared/services/importExport';
import { mapDatabaseError } from '../../shared/utils/errorFunctions';
import { requireDatabase } from '../database';

export const initImportExportHandlers = () => {
  ipcMain.handle('export-all-data', async event => {
    const db = requireDatabase(event);
    try {
      const payload = await importExportService.exportAllData(db);

      const defaultFileName = `invoice-builder-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const result = await dialog.showSaveDialog({
        title: 'Export',
        defaultPath: join(process.env.USERPROFILE || process.cwd(), defaultFileName),
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });

      if (result.canceled || !result.filePath) return { success: false };

      await fs.writeFile(result.filePath, JSON.stringify(payload.data, null, 2), 'utf8');

      return { success: true, data: { filePath: result.filePath } };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, db.type) };
    }
  });

  ipcMain.handle('import-all-data', async event => {
    const db = requireDatabase(event);
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });

      if (canceled || !filePaths?.[0]) return { success: false };

      const content = await fs.readFile(filePaths[0], 'utf8');
      const parsed = JSON.parse(content);
      await importExportService.importAllData(db, parsed);
      return { success: true };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, db.type) };
    }
  });
};
