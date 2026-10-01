import type { LayoutAdd, LayoutUpdate } from '@invoice-builder/contracts';
import { IpcChannel } from '@invoice-builder/contracts';
import { dialog, ipcMain } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getBackendConfig } from '@invoice-builder/core/config';
import * as service from '@invoice-builder/core/services/layouts';
import { mapDatabaseError } from '@invoice-builder/core/utils/errorFunctions';
import { requireDatabase } from '../database';

export const initLayoutsHandlers = () => {
  const defaultDirectory = getBackendConfig().electron.defaultDirectory;
  ipcMain.handle(IpcChannel.getAllLayouts, (event, filter) => service.getAllLayouts(requireDatabase(event), filter));
  ipcMain.handle(IpcChannel.addLayout, (event, data: LayoutAdd) => service.addLayout(requireDatabase(event), data));
  ipcMain.handle(IpcChannel.updateLayout, (event, data: LayoutUpdate) =>
    service.updateLayout(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.deleteLayout, (event, id: number) => service.deleteLayout(requireDatabase(event), id));
  ipcMain.handle(IpcChannel.exportLayout, async (event, id: number) => {
    const db = requireDatabase(event);
    try {
      const layout = await service.exportLayout(db, id);
      if (!layout.success || !layout.data) return layout;

      const fileName = `${layout.data.schema.meta.name.replace(/[^a-z0-9_-]/gi, '_') || 'layout'}.json`;
      const result = await dialog.showSaveDialog({
        title: 'Export layout',
        defaultPath: join(defaultDirectory, fileName),
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (result.canceled || !result.filePath) return { success: false };

      await fs.writeFile(result.filePath, JSON.stringify(layout.data.schema, null, 2), 'utf8');
      return { success: true, data: { filePath: result.filePath } };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, db.type) };
    }
  });
};
