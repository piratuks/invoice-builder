import type { UnitAdd, UnitUpdate } from '@invoice-builder/contracts';
import { IpcChannel } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as unitsService from '@invoice-builder/core/services/units';

import { requireDatabase } from '../database';

export const initUnitsHandlers = () => {
  ipcMain.handle(IpcChannel.addUnit, async (event, data: UnitAdd) =>
    unitsService.addUnit(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updateUnit, async (event, data: UnitUpdate) =>
    unitsService.updateUnit(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deleteUnit, async (event, id: number) =>
    unitsService.deleteUnit(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.batchAddUnit, async (event, data: UnitAdd[]) =>
    unitsService.batchAddUnit(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getAllUnits, async (event, filter) =>
    unitsService.getAllUnits(requireDatabase(event), filter)
  );
};
