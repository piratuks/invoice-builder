import { ipcMain } from 'electron';
import * as banksService from '../../shared/services/banks';
import type { Bank } from '../../shared/types/bank';
import { requireDatabase } from '../database';

export const initBanksHandlers = () => {
  ipcMain.handle('add-bank', async (event, data: Bank) => banksService.addBank(requireDatabase(event), data));
  ipcMain.handle('update-bank', async (event, data: Bank) => banksService.updateBank(requireDatabase(event), data));
  ipcMain.handle('delete-bank', async (event, id: number) => banksService.deleteBank(requireDatabase(event), id));
  ipcMain.handle('batch-add-bank', async (event, data: Bank[]) =>
    banksService.batchAddBank(requireDatabase(event), data)
  );
  ipcMain.handle('get-all-banks', async (event, filter) => banksService.getAllBanks(requireDatabase(event), filter));
};
