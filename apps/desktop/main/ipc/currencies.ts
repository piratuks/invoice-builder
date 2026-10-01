import { IpcChannel } from '@invoice-builder/contracts';
import type { CurrencyAdd, CurrencyUpdate } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as currenciesService from '@invoice-builder/core/services/currencies';

import { requireDatabase } from '../database';

export const initCurrenciesHandlers = () => {
  ipcMain.handle(IpcChannel.addCurrency, async (event, data: CurrencyAdd) =>
    currenciesService.addCurrency(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updateCurrency, async (event, data: CurrencyUpdate) =>
    currenciesService.updateCurrency(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deleteCurrency, async (event, id: number) =>
    currenciesService.deleteCurrency(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.batchAddCurrency, async (event, data: CurrencyAdd[]) =>
    currenciesService.batchAddCurrency(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getAllCurrencies, async (event, filter) =>
    currenciesService.getAllCurrencies(requireDatabase(event), filter)
  );
};
