import type { BusinessAdd, BusinessUpdate } from '@invoice-builder/contracts';
import { IpcChannel } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as businessesService from '@invoice-builder/core/services/businesses';

import { requireDatabase } from '../database';

export const initBusinessesHandlers = () => {
  ipcMain.handle(IpcChannel.addBusiness, async (event, data: BusinessAdd) =>
    businessesService.addBusiness(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updateBusiness, async (event, data: BusinessUpdate) =>
    businessesService.updateBusiness(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deleteBusiness, async (event, id: number) =>
    businessesService.deleteBusiness(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.batchAddBusiness, async (event, data: BusinessAdd[]) =>
    businessesService.batchAddBusiness(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getAllBusinesses, async (event, filter) =>
    businessesService.getAllBusinesses(requireDatabase(event), filter)
  );
};
