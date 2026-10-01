import { IpcChannel } from '@invoice-builder/contracts';
import type { ClientAdd, ClientUpdate } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as clientsService from '@invoice-builder/core/services/clients';

import { requireDatabase } from '../database';

export const initClientsHandlers = () => {
  ipcMain.handle(IpcChannel.addClient, async (event, data: ClientAdd) =>
    clientsService.addClient(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updateClient, async (event, data: ClientUpdate) =>
    clientsService.updateClient(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deleteClient, async (event, id: number) =>
    clientsService.deleteClient(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.batchAddClient, async (event, data: ClientAdd[]) =>
    clientsService.batchAddClient(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getAllClients, async (event, filter) =>
    clientsService.getAllClients(requireDatabase(event), filter)
  );
};
