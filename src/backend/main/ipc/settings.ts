import { ipcMain } from 'electron';
import * as settingsService from '../../shared/services/settings';
import type { Settings } from '../../shared/types/settings';
import { requireDatabase } from '../database';

export const initSettingsHandlers = () => {
  ipcMain.handle('get-all-settings', async event => settingsService.getAllSettings(requireDatabase(event)));
  ipcMain.handle('update-settings', async (event, data: Settings) =>
    settingsService.updateSettings(requireDatabase(event), data)
  );
};
