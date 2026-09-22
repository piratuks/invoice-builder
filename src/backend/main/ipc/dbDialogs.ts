import { dialog, ipcMain } from 'electron';
import { join } from 'path';
import { testPostgresConnection } from '../../shared/db/setup';
import { DatabaseType } from '../../shared/enums/databaseType';
import { DBInitType } from '../../shared/enums/dbInitType';
import type { PostgresConfig } from '../../shared/types/postgresConfig';
import { mapDatabaseError } from '../../shared/utils/errorFunctions';
import { setupDB } from '../database';

export const initDBDialogsHandlers = (dbName: string) => {
  ipcMain.handle('show-save-db-dialog', async () => {
    const defaultPath = join(process.env.USERPROFILE || process.cwd(), `${dbName}.db`);
    const result = await dialog.showSaveDialog({
      title: 'Select a path and database file name',
      defaultPath,
      filters: [{ name: 'SQLite DB', extensions: ['db'] }]
    });
    return { success: true, data: { canceled: result.canceled, filePath: result.filePath } };
  });
  ipcMain.handle('show-open-db-dialog', async () => {
    const defaultPath = join(process.env.USERPROFILE || process.cwd(), `${dbName}.db`);
    const result = await dialog.showOpenDialog({
      title: 'Open existing database file',
      defaultPath,
      filters: [{ name: 'SQLite DB', extensions: ['db'] }],
      properties: ['openFile']
    });
    return {
      success: true,
      data: {
        canceled: result.canceled,
        filePath: Array.isArray(result.filePaths) && result.filePaths.length ? result.filePaths[0] : undefined
      }
    };
  });
  ipcMain.handle('test-connection', async (_event, postgresConfig?: PostgresConfig) => {
    try {
      await testPostgresConnection(postgresConfig);
      return { success: true };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, DatabaseType.postgre) };
    }
  });
  ipcMain.handle(
    'initialize-db',
    async (
      event,
      opts: { fullPath?: string; dbType: DatabaseType; mode?: DBInitType; postgresConfig?: PostgresConfig }
    ) => {
      try {
        const createIfMissing = opts.mode === DBInitType.create || typeof opts.mode === 'undefined';

        await setupDB({
          sqliteConfig: { fullPath: opts.fullPath },
          dbType: opts.dbType,
          createIfMissing,
          windowId: event.sender.id,
          postgresConfig: opts.postgresConfig
        });
        return { success: true };
      } catch (error) {
        return { success: false, ...mapDatabaseError(error, opts.dbType) };
      }
    }
  );
};
