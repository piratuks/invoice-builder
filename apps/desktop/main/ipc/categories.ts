import { IpcChannel } from '@invoice-builder/contracts';
import type { CategoryAdd, CategoryUpdate } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as categoriesService from '@invoice-builder/core/services/categories';

import { requireDatabase } from '../database';

export const initCategoriesHandlers = () => {
  ipcMain.handle(IpcChannel.addCategory, async (event, data: CategoryAdd) =>
    categoriesService.addCategory(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updateCategory, async (event, data: CategoryUpdate) =>
    categoriesService.updateCategory(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deleteCategory, async (event, id: number) =>
    categoriesService.deleteCategory(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.batchAddCategory, async (event, data: CategoryAdd[]) =>
    categoriesService.batchAddCategory(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getAllCategories, async (event, filter) =>
    categoriesService.getAllCategories(requireDatabase(event), filter)
  );
};
