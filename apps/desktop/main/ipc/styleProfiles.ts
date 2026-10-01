import { IpcChannel } from '@invoice-builder/contracts';
import type { StyleProfileAdd, StyleProfileUpdate } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as styleProfilesService from '@invoice-builder/core/services/styleProfiles';
import { requireDatabase } from '../database';

export const initStyleProfilesHandlers = () => {
  ipcMain.handle(IpcChannel.addStyleProfile, async (event, data: StyleProfileAdd) =>
    styleProfilesService.addStyleProfile(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updateStyleProfile, async (event, data: StyleProfileUpdate) =>
    styleProfilesService.updateStyleProfile(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deleteStyleProfile, async (event, id: number) =>
    styleProfilesService.deleteStyleProfile(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.batchAddStyleProfile, async (event, data: StyleProfileAdd[]) =>
    styleProfilesService.batchAddStyleProfile(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getAllStyleProfiles, async (event, filter) =>
    styleProfilesService.getAllStyleProfiles(requireDatabase(event), filter)
  );
};
