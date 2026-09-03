import { BrowserWindow, ipcMain, shell } from 'electron';
import type { DatabaseAdapter } from '../../shared/types/DatabaseAdapter';
import { initAutoUpdaterHandlers } from './autoUpdater';
import { initBanksHandlers } from './banks';
import { initBusinessesHandlers } from './businesses';
import { initCategoriesHandlers } from './categories';
import { initClientsHandlers } from './clients';
import { initCurrenciesHandlers } from './currencies';
import { initImportExportHandlers } from './importExport';
import { initInvoicesHandlers } from './invoices';
import { initItemsHandlers } from './items';
import { initLayoutsHandlers } from './layouts';
import { initPresetHandlers } from './presets';
import { initReceiptHandlers } from './receipt';
import { initSettingsHandlers } from './settings';
import { initStyleProfilesHandlers } from './styleProfiles';
import { initUnitsHandlers } from './units';

export const initIpcHandler = (db: DatabaseAdapter, mainWindow: BrowserWindow) => {
  if (!db) throw new Error('error.databaseNotInitialized');

  ipcMain.handle('open-url', async (_event, url: string) => {
    await shell.openExternal(url);
  });

  initAutoUpdaterHandlers(mainWindow);
  initBusinessesHandlers(db);
  initStyleProfilesHandlers(db);
  initCategoriesHandlers(db);
  initClientsHandlers(db);
  initCurrenciesHandlers(db);
  initImportExportHandlers(db);
  initLayoutsHandlers(db);
  initInvoicesHandlers(db);
  initItemsHandlers(db);
  initSettingsHandlers(db);
  initUnitsHandlers(db);
  initBanksHandlers(db);
  initPresetHandlers(db);
  initReceiptHandlers();
};
