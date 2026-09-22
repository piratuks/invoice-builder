import { ipcMain } from 'electron';
import * as currenciesService from '../../shared/services/currencies';
import type { Currency } from '../../shared/types/currency';
import { requireDatabase } from '../database';

export const initCurrenciesHandlers = () => {
  ipcMain.handle('add-currency', async (event, data: Currency) =>
    currenciesService.addCurrency(requireDatabase(event), data)
  );
  ipcMain.handle('update-currency', async (event, data: Currency) =>
    currenciesService.updateCurrency(requireDatabase(event), data)
  );
  ipcMain.handle('delete-currency', async (event, id: number) =>
    currenciesService.deleteCurrency(requireDatabase(event), id)
  );
  ipcMain.handle('batch-add-currency', async (event, data: Currency[]) =>
    currenciesService.batchAddCurrency(requireDatabase(event), data)
  );
  ipcMain.handle('get-all-currencies', async (event, filter) =>
    currenciesService.getAllCurrencies(requireDatabase(event), filter)
  );
};
