import { BrowserWindow, dialog, ipcMain } from 'electron';
import { join } from 'path';
import { testPostgresConnection } from '../../shared/db/setup';
import { DatabaseType } from '../../shared/enums/databaseType';
import { DBInitType } from '../../shared/enums/dbInitType';
import type { PostgresConfig } from '../../shared/types/postgresConfig';
import { mapDatabaseError } from '../../shared/utils/errorFunctions';
import { setupDB } from '../database';

const resetIPCHandlers = () => {
  const handlers = [
    'open-url',
    'get-all-settings',
    'update-settings',
    'add-client',
    'update-client',
    'delete-client',
    'batch-add-client',
    'get-all-clients',
    'add-business',
    'update-business',
    'delete-business',
    'batch-add-business',
    'get-all-businesses',
    'add-item',
    'update-item',
    'delete-item',
    'batch-add-item',
    'get-all-items',
    'add-unit',
    'update-unit',
    'delete-unit',
    'batch-add-unit',
    'get-all-units',
    'add-category',
    'update-category',
    'delete-category',
    'batch-add-category',
    'get-all-categories',
    'add-currency',
    'update-currency',
    'delete-currency',
    'batch-add-currency',
    'get-all-currencies',
    'get-einvoice-xml',
    'get-next-sequence',
    'get-custom-headers',
    'get-all-invoices',
    'delete-invoice',
    'update-invoice',
    'add-invoice',
    'duplicate-invoice',
    'export-all-data',
    'import-all-data',
    'restart-app',
    'get-app-version',
    'check-for-updates',
    'add-styleProfile',
    'update-styleProfile',
    'delete-styleProfile',
    'batch-add-styleProfile',
    'get-all-styleProfiles',
    'add-bank',
    'update-bank',
    'delete-bank',
    'batch-add-bank',
    'get-all-banks',
    'add-preset',
    'update-preset',
    'delete-preset',
    'batch-add-preset',
    'get-all-presets',
    'print-receipt',
    'get-all-layouts',
    'add-layout',
    'update-layout',
    'delete-layout',
    'export-layout'
  ];

  handlers.forEach(handler => ipcMain.removeHandler(handler));
};

export const initDBDialogsHandlers = (dbName: string, mainWindow: BrowserWindow) => {
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
      _event,
      opts: { fullPath?: string; dbType: DatabaseType; mode?: DBInitType; postgresConfig?: PostgresConfig }
    ) => {
      try {
        resetIPCHandlers();
        const createIfMissing = opts.mode === DBInitType.create || typeof opts.mode === 'undefined';

        await setupDB({
          sqliteConfig: { fullPath: opts.fullPath },
          dbType: opts.dbType,
          createIfMissing,
          mainWindow,
          postgresConfig: opts.postgresConfig
        });
        return { success: true };
      } catch (error) {
        return { success: false, ...mapDatabaseError(error, opts.dbType) };
      }
    }
  );
};
