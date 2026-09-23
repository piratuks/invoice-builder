import { config } from 'dotenv';
import { app, BrowserWindow } from 'electron';
import { join, resolve } from 'path';
import { APP_CONFIG } from './config';
import { cleanupDatabase } from './database';
import { stopAllInvoiceScheduleRuntimes } from './invoiceScheduleRuntime';
import { initIpcHandler } from './ipc';
import { initDBDialogsHandlers } from './ipc/dbDialogs';

config();

const isDev = !app.isPackaged;
const devServer = APP_CONFIG.FE_SERVER_URL;
const dbName = APP_CONFIG.DB_NAME;
const mainAssetsPath = isDev
  ? join(resolve(), 'dist-be/backend/main/assets')
  : join(app.getAppPath(), 'dist-be/backend/main/assets');
const preloadPath = isDev
  ? join(resolve(), 'dist-be/preload/preload.cjs')
  : join(app.getAppPath(), 'dist-be/preload/preload.cjs');
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
  stopAllInvoiceScheduleRuntimes();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
