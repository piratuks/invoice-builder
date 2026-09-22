import { BrowserWindow, ipcMain, shell } from 'electron';
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

export const initIpcHandler = (mainWindow: BrowserWindow) => {
  ipcMain.handle('open-url', async (_event, url: string) => {
    await shell.openExternal(url);
  });

  initAutoUpdaterHandlers(mainWindow);
  initBusinessesHandlers();
  initStyleProfilesHandlers();
  initCategoriesHandlers();
  initClientsHandlers();
  initCurrenciesHandlers();
  initImportExportHandlers();
  initLayoutsHandlers();
  initInvoicesHandlers();
  initItemsHandlers();
  initSettingsHandlers();
  initUnitsHandlers();
  initBanksHandlers();
  initPresetHandlers();
  initReceiptHandlers();
};
