import { IpcChannel } from '@invoice-builder/contracts';
import type { PresetAdd, PresetUpdate } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as presetsService from '@invoice-builder/core/services/presets';
import { requireDatabase } from '../database';

export const initPresetHandlers = () => {
  ipcMain.handle(IpcChannel.addPreset, async (event, data: PresetAdd) =>
    presetsService.addPreset(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updatePreset, async (event, data: PresetUpdate) =>
    presetsService.updatePreset(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deletePreset, async (event, id: number) =>
    presetsService.deletePreset(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.batchAddPreset, async (event, data: PresetAdd[]) =>
    presetsService.batchAddPreset(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getAllPresets, async (event, filter) =>
    presetsService.getAllPresets(requireDatabase(event), filter)
  );
};
