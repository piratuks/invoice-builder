import type { BankAdd, BankUpdate } from '@invoice-builder/contracts';
import { IpcChannel } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as banksService from '@invoice-builder/core/services/banks';

import { requireDatabase } from '../database';

export const initBanksHandlers = () => {
  ipcMain.handle(IpcChannel.addBank, async (event, data: BankAdd) =>
    banksService.addBank(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updateBank, async (event, data: BankUpdate) =>
    banksService.updateBank(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deleteBank, async (event, id: number) =>
    banksService.deleteBank(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.batchAddBank, async (event, data: BankAdd[]) =>
    banksService.batchAddBank(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getAllBanks, async (event, filter) =>
    banksService.getAllBanks(requireDatabase(event), filter)
  );
};
