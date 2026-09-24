import { ipcMain } from 'electron';
import { testDeliveryProvider } from '../../shared/services/deliveryProviders';
import * as settingsService from '../../shared/services/settings';
import type { Settings } from '../../shared/types/settings';
import { requireDatabase } from '../database';
import { deleteSmtpPassword, getSmtpPassword, hasSmtpPassword, setSmtpPassword } from '../smtpPassword';

export const initSettingsHandlers = () => {
  ipcMain.handle('get-all-settings', async event => settingsService.getAllSettings(requireDatabase(event)));
  ipcMain.handle('update-settings', async (event, data: Settings) =>
    settingsService.updateSettings(requireDatabase(event), data)
  );
  ipcMain.handle('get-smtp-password-status', async () => hasSmtpPassword());
  ipcMain.handle('set-smtp-password', async (_event, password: string) => setSmtpPassword(password));
  ipcMain.handle('delete-smtp-password', async () => deleteSmtpPassword());
  ipcMain.handle('test-smtp-delivery', async (event, data: { recipient: string }) =>
    testDeliveryProvider(requireDatabase(event), {
      ...data,
      secrets: { smtpPassword: (await getSmtpPassword()) ?? undefined }
    })
  );
};
