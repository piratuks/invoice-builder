import { ipcMain } from 'electron';
import * as businessesService from '../../shared/services/businesses';
import type { Business } from '../../shared/types/business';
import { requireDatabase } from '../database';

export const initBusinessesHandlers = () => {
  ipcMain.handle('add-business', async (event, data: Business) =>
    businessesService.addBusiness(requireDatabase(event), data)
  );
  ipcMain.handle('update-business', async (event, data: Business) =>
    businessesService.updateBusiness(requireDatabase(event), data)
  );
  ipcMain.handle('delete-business', async (event, id: number) =>
    businessesService.deleteBusiness(requireDatabase(event), id)
  );
  ipcMain.handle('batch-add-business', async (event, data: Business[]) =>
    businessesService.batchAddBusiness(requireDatabase(event), data)
  );
  ipcMain.handle('get-all-businesses', async (event, filter) =>
    businessesService.getAllBusinesses(requireDatabase(event), filter)
  );
};
