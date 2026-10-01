import type { ItemAdd, ItemUpdate } from '@invoice-builder/contracts';
import { IpcChannel } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as itemsService from '@invoice-builder/core/services/items';

import { requireDatabase } from '../database';

export const initItemsHandlers = () => {
  ipcMain.handle(IpcChannel.addItem, async (event, data: ItemAdd) =>
    itemsService.addItem(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updateItem, async (event, data: ItemUpdate) =>
    itemsService.updateItem(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deleteItem, async (event, id: number) =>
    itemsService.deleteItem(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.batchAddItem, async (event, data: ItemAdd[]) =>
    itemsService.batchAddItem(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getAllItems, async (event, filter) =>
    itemsService.getAllItems(requireDatabase(event), filter)
  );
};
