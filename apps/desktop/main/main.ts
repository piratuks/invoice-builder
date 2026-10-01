import { getBackendConfig } from '@invoice-builder/core/config';
import { config } from 'dotenv';
import { app, BrowserWindow } from 'electron';
import { join, resolve } from 'path';
import { cleanupDatabase } from './database';
import { initIpcHandler } from './ipc';
import { initDBDialogsHandlers } from './ipc/dbDialogs';

config();

const backendConfig = getBackendConfig();
const isDev = !app.isPackaged;
const devServer = backendConfig.frontendUrl;
const dbName = backendConfig.databaseName;
const mainAssetsPath = isDev
  ? join(resolve(), 'dist-desktop/main/assets')
  : join(app.getAppPath(), 'dist-desktop/main/assets');
const preloadPath = isDev
  ? join(resolve(), 'dist-desktop/preload/preload.cjs')
  : join(app.getAppPath(), 'dist-desktop/preload/preload.cjs');
const indexHtmlPath = isDev ? devServer : join(app.getAppPath(), 'dist-fe/index.html');

let mainWindow: BrowserWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 768,
    show: true,
    autoHideMenuBar: true,
    icon: join(mainAssetsPath, 'icon.png'),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  const windowId = mainWindow.id;

  if (isDev) {
    mainWindow.loadURL(devServer);
    mainWindow.webContents.openDevTools();
  } else {
    if (indexHtmlPath) mainWindow.loadFile(indexHtmlPath);
  }

  mainWindow.on('closed', () => {
    void cleanupDatabase(windowId);
  });

  // mainWindow.once('ready-to-show', () => {
  //   mainWindow.show();
  // });
};

app.whenReady().then(() => {
  createWindow();
  initIpcHandler(mainWindow);
  initDBDialogsHandlers(dbName);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
