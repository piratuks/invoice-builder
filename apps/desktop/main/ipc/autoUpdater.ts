import { IpcChannel } from '@invoice-builder/contracts';
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

export const initAutoUpdaterHandlers = (mainWindow: BrowserWindow) => {
  ipcMain.on(IpcChannel.restartApp, () => {
    autoUpdater.quitAndInstall();
  });
  ipcMain.handle(IpcChannel.getAppVersion, () => {
    return app.getVersion();
  });
  ipcMain.on(IpcChannel.checkForUpdates, () => {
    autoUpdater.checkForUpdates();
  });
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send(IpcChannel.updateAvailable);
  });
  autoUpdater.on('update-downloaded', info => {
    mainWindow.webContents.send(IpcChannel.updateDownloaded, info.version);
  });
  autoUpdater.on('download-progress', progress => {
    mainWindow.webContents.send(IpcChannel.updateProgress, progress);
  });
  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send(IpcChannel.updateNotAvailable);
  });
};
