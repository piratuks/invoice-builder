import type {
  BankAdd,
  BankUpdate,
  BusinessAdd,
  BusinessUpdate,
  CategoryAdd,
  CategoryUpdate,
  ClientAdd,
  ClientUpdate,
  CurrencyAdd,
  CurrencyUpdate,
  EInvoice,
  ElectronAPI,
  FilterData,
  InvoiceAdd,
  InvoiceType,
  InvoiceUpdate,
  ItemAdd,
  ItemUpdate,
  LayoutAdd,
  LayoutUpdate,
  PostgresConfig,
  PresetAdd,
  PresetUpdate,
  ProgressInfo,
  SettingsUpdate,
  StyleProfileAdd,
  StyleProfileUpdate,
  UnitAdd,
  UnitUpdate
} from '@invoice-builder/contracts';
import { IpcChannel } from '@invoice-builder/contracts';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => console.log('pong'),

  getAppVersion: () => ipcRenderer.invoke(IpcChannel.getAppVersion),

  checkForUpdates: async () => {
    ipcRenderer.send(IpcChannel.checkForUpdates);
  },
  restartApp: () => ipcRenderer.send(IpcChannel.restartApp),
  onUpdateProgress: (callback: (data: ProgressInfo) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: ProgressInfo) => callback(data);
    ipcRenderer.on(IpcChannel.updateProgress, listener);
    return () => ipcRenderer.removeListener(IpcChannel.updateProgress, listener);
  },
  onUpdateAvailable: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on(IpcChannel.updateAvailable, listener);
    return () => ipcRenderer.removeListener(IpcChannel.updateAvailable, listener);
  },
  onUpdateNotAvailable: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on(IpcChannel.updateNotAvailable, listener);
    return () => ipcRenderer.removeListener(IpcChannel.updateNotAvailable, listener);
  },
  onUpdateDownloaded: (callback: (version: string) => void) => {
    const listener = (_: Electron.IpcRendererEvent, version: string) => callback(version);
    ipcRenderer.on(IpcChannel.updateDownloaded, listener);
    return () => ipcRenderer.removeListener(IpcChannel.updateDownloaded, listener);
  },

  testConnection: (data: PostgresConfig) => ipcRenderer.invoke(IpcChannel.testConnection, data),
  selectDatabase: () => ipcRenderer.invoke(IpcChannel.showSaveDbDialog),
  openDatabase: () => ipcRenderer.invoke(IpcChannel.showOpenDbDialog),
  initializeDatabase: data => ipcRenderer.invoke(IpcChannel.initializeDb, data),
  getDatabaseList: async () => ({ success: true, data: [] }),

  openUrl: (url: string) => ipcRenderer.invoke(IpcChannel.openUrl, url),

  getAllSettings: () => ipcRenderer.invoke(IpcChannel.getAllSettings),
  updateSettings: (data: SettingsUpdate) => ipcRenderer.invoke(IpcChannel.updateSettings, data),

  getAllBusinesses: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllBusinesses, filter),
  updateBusiness: (data: BusinessUpdate) => ipcRenderer.invoke(IpcChannel.updateBusiness, data),
  deleteBusiness: (id: number) => ipcRenderer.invoke(IpcChannel.deleteBusiness, id),
  addBusiness: (data: BusinessAdd) => ipcRenderer.invoke(IpcChannel.addBusiness, data),
  addBatchBusiness: (data: BusinessAdd[]) => ipcRenderer.invoke(IpcChannel.batchAddBusiness, data),

  getAllStyleProfiles: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllStyleProfiles, filter),
  updateStyleProfile: (data: StyleProfileUpdate) => ipcRenderer.invoke(IpcChannel.updateStyleProfile, data),
  deleteStyleProfile: (id: number) => ipcRenderer.invoke(IpcChannel.deleteStyleProfile, id),
  addStyleProfile: (data: StyleProfileAdd) => ipcRenderer.invoke(IpcChannel.addStyleProfile, data),
  addBatchStyleProfile: (data: StyleProfileAdd[]) => ipcRenderer.invoke(IpcChannel.batchAddStyleProfile, data),

  getAllLayouts: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllLayouts, filter),
  updateLayout: (data: LayoutUpdate) => ipcRenderer.invoke(IpcChannel.updateLayout, data),
  deleteLayout: (id: number) => ipcRenderer.invoke(IpcChannel.deleteLayout, id),
  addLayout: (data: LayoutAdd) => ipcRenderer.invoke(IpcChannel.addLayout, data),
  exportLayout: (id: number) => ipcRenderer.invoke(IpcChannel.exportLayout, id),

  getAllClients: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllClients, filter),
  updateClient: (data: ClientUpdate) => ipcRenderer.invoke(IpcChannel.updateClient, data),
  deleteClient: (id: number) => ipcRenderer.invoke(IpcChannel.deleteClient, id),
  addClient: (data: ClientAdd) => ipcRenderer.invoke(IpcChannel.addClient, data),
  addBatchClient: (data: ClientAdd[]) => ipcRenderer.invoke(IpcChannel.batchAddClient, data),

  getAllItems: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllItems, filter),
  updateItem: (data: ItemUpdate) => ipcRenderer.invoke(IpcChannel.updateItem, data),
  deleteItem: (id: number) => ipcRenderer.invoke(IpcChannel.deleteItem, id),
  addItem: (data: ItemAdd) => ipcRenderer.invoke(IpcChannel.addItem, data),
  addBatchItem: (data: ItemAdd[]) => ipcRenderer.invoke(IpcChannel.batchAddItem, data),

  getAllUnits: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllUnits, filter),
  updateUnit: (data: UnitUpdate) => ipcRenderer.invoke(IpcChannel.updateUnit, data),
  deleteUnit: (id: number) => ipcRenderer.invoke(IpcChannel.deleteUnit, id),
  addUnit: (data: UnitAdd) => ipcRenderer.invoke(IpcChannel.addUnit, data),
  addBatchUnit: (data: UnitAdd[]) => ipcRenderer.invoke(IpcChannel.batchAddUnit, data),

  getAllCategories: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllCategories, filter),
  updateCategory: (data: CategoryUpdate) => ipcRenderer.invoke(IpcChannel.updateCategory, data),
  deleteCategory: (id: number) => ipcRenderer.invoke(IpcChannel.deleteCategory, id),
  addCategory: (data: CategoryAdd) => ipcRenderer.invoke(IpcChannel.addCategory, data),
  addBatchCategory: (data: CategoryAdd[]) => ipcRenderer.invoke(IpcChannel.batchAddCategory, data),

  getAllCurrencies: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllCurrencies, filter),
  updateCurrency: (data: CurrencyUpdate) => ipcRenderer.invoke(IpcChannel.updateCurrency, data),
  deleteCurrency: (id: number) => ipcRenderer.invoke(IpcChannel.deleteCurrency, id),
  addCurrency: (data: CurrencyAdd) => ipcRenderer.invoke(IpcChannel.addCurrency, data),
  addBatchCurrency: (data: CurrencyAdd[]) => ipcRenderer.invoke(IpcChannel.batchAddCurrency, data),

  getNextSequence: (data: { businessId: number; clientId: number; invoiceType: InvoiceType }) =>
    ipcRenderer.invoke(IpcChannel.getNextSequence, data),
  getEInvoiceXML: (data: { invoiceId: number; einvoice: EInvoice }) =>
    ipcRenderer.invoke(IpcChannel.getEinvoiceXml, data),
  getCustomHeaders: (type: InvoiceType) => ipcRenderer.invoke(IpcChannel.getCustomHeaders, type),
  getAllInvoices: (type?: InvoiceType, filter?: FilterData[]) =>
    ipcRenderer.invoke(IpcChannel.getAllInvoices, type, filter),
  deleteInvoice: (id: number) => ipcRenderer.invoke(IpcChannel.deleteInvoice, id),
  updateInvoice: (data: InvoiceUpdate) => ipcRenderer.invoke(IpcChannel.updateInvoice, data),
  addInvoice: (data: InvoiceAdd) => ipcRenderer.invoke(IpcChannel.addInvoice, data),
  duplicateInvoice: (id: number, invoiceType: InvoiceType) =>
    ipcRenderer.invoke(IpcChannel.duplicateInvoice, id, invoiceType),

  getAllBanks: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllBanks, filter),
  updateBank: (data: BankUpdate) => ipcRenderer.invoke(IpcChannel.updateBank, data),
  deleteBank: (id: number) => ipcRenderer.invoke(IpcChannel.deleteBank, id),
  addBank: (data: BankAdd) => ipcRenderer.invoke(IpcChannel.addBank, data),
  addBatchBank: (data: BankAdd[]) => ipcRenderer.invoke(IpcChannel.batchAddBank, data),

  getAllPresets: (filter?: FilterData[]) => ipcRenderer.invoke(IpcChannel.getAllPresets, filter),
  updatePreset: (data: PresetUpdate) => ipcRenderer.invoke(IpcChannel.updatePreset, data),
  deletePreset: (id: number) => ipcRenderer.invoke(IpcChannel.deletePreset, id),
  addPreset: (data: PresetAdd) => ipcRenderer.invoke(IpcChannel.addPreset, data),
  addBatchPreset: (data: PresetAdd[]) => ipcRenderer.invoke(IpcChannel.batchAddPreset, data),

  exportAllData: () => ipcRenderer.invoke(IpcChannel.exportAllData),
  importAllData: () => ipcRenderer.invoke(IpcChannel.importAllData),

  printReceipt: (html: string) => ipcRenderer.invoke(IpcChannel.printReceipt, html)
} satisfies ElectronAPI);
