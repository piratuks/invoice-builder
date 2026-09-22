import { ipcMain } from 'electron';
import * as categoriesService from '../../shared/services/categories';
import type { Category } from '../../shared/types/category';
import { requireDatabase } from '../database';

export const initCategoriesHandlers = () => {
  ipcMain.handle('add-category', async (event, data: Category) =>
    categoriesService.addCategory(requireDatabase(event), data)
  );
  ipcMain.handle('update-category', async (event, data: Category) =>
    categoriesService.updateCategory(requireDatabase(event), data)
  );
  ipcMain.handle('delete-category', async (event, id: number) =>
    categoriesService.deleteCategory(requireDatabase(event), id)
  );
  ipcMain.handle('batch-add-category', async (event, data: Category[]) =>
    categoriesService.batchAddCategory(requireDatabase(event), data)
  );
  ipcMain.handle('get-all-categories', async (event, filter) =>
    categoriesService.getAllCategories(requireDatabase(event), filter)
  );
};
