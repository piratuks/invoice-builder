import { ipcMain } from 'electron';
import * as presetsService from '../../shared/services/presets';
import type { Preset } from '../../shared/types/preset';
import { requireDatabase } from '../database';

export const initPresetHandlers = () => {
  ipcMain.handle('add-preset', async (event, data: Preset) => presetsService.addPreset(requireDatabase(event), data));
  ipcMain.handle('update-preset', async (event, data: Preset) =>
    presetsService.updatePreset(requireDatabase(event), data)
  );
  ipcMain.handle('delete-preset', async (event, id: number) => presetsService.deletePreset(requireDatabase(event), id));
  ipcMain.handle('batch-add-preset', async (event, data: Preset[]) =>
    presetsService.batchAddPreset(requireDatabase(event), data)
  );
  ipcMain.handle('get-all-presets', async (event, filter) =>
    presetsService.getAllPresets(requireDatabase(event), filter)
  );
};
