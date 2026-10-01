import { dialog, ipcMain } from 'electron';
import { join } from 'path';
import { getBackendConfig } from '@invoice-builder/core/config';
import { testPostgresConnection } from '@invoice-builder/core/db/setup';
import type { PostgresConfig } from '@invoice-builder/contracts';
import { DatabaseType, DBInitType, IpcChannel } from '@invoice-builder/contracts';

import { mapDatabaseError } from '@invoice-builder/core/utils/errorFunctions';
import { setupDB } from '../database';

export const initDBDialogsHandlers = (dbName: string) => {
  const defaultDirectory = getBackendConfig().electron.defaultDirectory;
  ipcMain.handle(IpcChannel.showSaveDbDialog, async () => {
    const defaultPath = join(defaultDirectory, `${dbName}.db`);
    const result = await dialog.showSaveDialog({
      title: 'Select a path and database file name',
      defaultPath,
      filters: [{ name: 'SQLite DB', extensions: ['db'] }]
    });
    return { success: true, data: { canceled: result.canceled, filePath: result.filePath } };
  });
  ipcMain.handle(IpcChannel.showOpenDbDialog, async () => {
    const defaultPath = join(defaultDirectory, `${dbName}.db`);
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
  ipcMain.handle(IpcChannel.testConnection, async (_event, postgresConfig?: PostgresConfig) => {
    try {
      await testPostgresConnection(postgresConfig);
      return { success: true };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, DatabaseType.postgre) };
    }
  });
  ipcMain.handle(
    IpcChannel.initializeDb,
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
