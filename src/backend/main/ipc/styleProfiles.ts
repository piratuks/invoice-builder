import { ipcMain } from 'electron';
import * as styleProfilesService from '../../shared/services/styleProfiles';
import type { StyleProfile } from '../../shared/types/styleProfiles';
import { requireDatabase } from '../database';

export const initStyleProfilesHandlers = () => {
  ipcMain.handle('add-styleProfile', async (event, data: StyleProfile) =>
    styleProfilesService.addStyleProfile(requireDatabase(event), data)
  );
  ipcMain.handle('update-styleProfile', async (event, data: StyleProfile) =>
    styleProfilesService.updateStyleProfile(requireDatabase(event), data)
  );
  ipcMain.handle('delete-styleProfile', async (event, id: number) =>
    styleProfilesService.deleteStyleProfile(requireDatabase(event), id)
  );
  ipcMain.handle('batch-add-styleProfile', async (event, data: StyleProfile[]) =>
    styleProfilesService.batchAddStyleProfile(requireDatabase(event), data)
  );
  ipcMain.handle('get-all-styleProfiles', async (event, filter) =>
    styleProfilesService.getAllStyleProfiles(requireDatabase(event), filter)
  );
};
