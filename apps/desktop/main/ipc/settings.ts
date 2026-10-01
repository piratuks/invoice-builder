import type { SettingsUpdate } from '@invoice-builder/contracts';
import { IpcChannel } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as settingsService from '@invoice-builder/core/services/settings';

import { requireDatabase } from '../database';

export const initSettingsHandlers = () => {
  ipcMain.handle(IpcChannel.getAllSettings, async event => settingsService.getAllSettings(requireDatabase(event)));
  ipcMain.handle(IpcChannel.updateSettings, async (event, data: SettingsUpdate) =>
    settingsService.updateSettings(requireDatabase(event), data)
  );
};
