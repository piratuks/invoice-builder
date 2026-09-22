import { ipcMain } from 'electron';
import * as unitsService from '../../shared/services/units';
import type { Unit } from '../../shared/types/unit';
import { requireDatabase } from '../database';

export const initUnitsHandlers = () => {
  ipcMain.handle('add-unit', async (event, data: Unit) => unitsService.addUnit(requireDatabase(event), data));
  ipcMain.handle('update-unit', async (event, data: Unit) => unitsService.updateUnit(requireDatabase(event), data));
  ipcMain.handle('delete-unit', async (event, id: number) => unitsService.deleteUnit(requireDatabase(event), id));
  ipcMain.handle('batch-add-unit', async (event, data: Unit[]) =>
    unitsService.batchAddUnit(requireDatabase(event), data)
  );
  ipcMain.handle('get-all-units', async (event, filter) => unitsService.getAllUnits(requireDatabase(event), filter));
};
