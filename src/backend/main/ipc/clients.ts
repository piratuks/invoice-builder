import { ipcMain } from 'electron';
import * as clientsService from '../../shared/services/clients';
import type { Client } from '../../shared/types/client';
import { requireDatabase } from '../database';

export const initClientsHandlers = () => {
  ipcMain.handle('add-client', async (event, data: Client) => clientsService.addClient(requireDatabase(event), data));
  ipcMain.handle('update-client', async (event, data: Client) =>
    clientsService.updateClient(requireDatabase(event), data)
  );
  ipcMain.handle('delete-client', async (event, id: number) => clientsService.deleteClient(requireDatabase(event), id));
  ipcMain.handle('batch-add-client', async (event, data: Client[]) =>
    clientsService.batchAddClient(requireDatabase(event), data)
  );
  ipcMain.handle('get-all-clients', async (event, filter) =>
    clientsService.getAllClients(requireDatabase(event), filter)
  );
};
