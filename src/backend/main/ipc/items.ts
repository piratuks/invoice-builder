import { ipcMain } from 'electron';
import * as itemsService from '../../shared/services/items';
import type { Item } from '../../shared/types/item';
import { requireDatabase } from '../database';

export const initItemsHandlers = () => {
  ipcMain.handle('add-item', async (event, data: Item) => itemsService.addItem(requireDatabase(event), data));
  ipcMain.handle('update-item', async (event, data: Item) => itemsService.updateItem(requireDatabase(event), data));
  ipcMain.handle('delete-item', async (event, id: number) => itemsService.deleteItem(requireDatabase(event), id));
  ipcMain.handle('batch-add-item', async (event, data: Item[]) =>
    itemsService.batchAddItem(requireDatabase(event), data)
  );
  ipcMain.handle('get-all-items', async (event, filter) => itemsService.getAllItems(requireDatabase(event), filter));
};
