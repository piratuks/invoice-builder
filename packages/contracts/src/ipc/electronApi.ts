import type { DatabaseType } from '../enums/databaseType';
import type { DBInitType } from '../enums/dbInitType';
import type { EInvoice } from '../enums/einvoice';
import type { InvoiceType } from '../enums/invoiceType';
import type { Bank, BankAdd, BankUpdate } from '../types/bank';
import type { Business, BusinessAdd, BusinessUpdate } from '../types/business';
import type { Category, CategoryAdd, CategoryUpdate } from '../types/category';
import type { Client, ClientAdd, ClientUpdate } from '../types/client';
import type { Currency, CurrencyAdd, CurrencyUpdate } from '../types/currency';
import type { DBSelector } from '../types/dbSelector';
import type { ExportMeta } from '../types/exportMeta';
import type { FilterData } from '../types/filter';
import type { CustomFieldMeta, Invoice, InvoiceAdd, InvoiceUpdate, NextSequenceData } from '../types/invoice';
import type { Item, ItemAdd, ItemUpdate } from '../types/item';
import type { Layout, LayoutAdd, LayoutUpdate } from '../types/layouts';
import type { PostgresConfig } from '../types/postgresConfig';
import type { Preset, PresetAdd, PresetUpdate } from '../types/preset';
import type { Response } from '../types/response';
import type { Settings, SettingsUpdate } from '../types/settings';
import type { StyleProfile, StyleProfileAdd, StyleProfileUpdate } from '../types/styleProfiles';
import type { Unit, UnitAdd, UnitUpdate } from '../types/unit';
import type { ProgressInfo } from '../types/updater';

/** API exposed by the preload script as `window.electronAPI`. */
export interface ElectronAPI {
  ping: () => void;

  getAppVersion: () => Promise<string>;

  checkForUpdates: () => Promise<void>;
  restartApp: () => void;
  onUpdateProgress: (callback: (data: ProgressInfo) => void) => () => void;
  onUpdateAvailable: (callback: () => void) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  onUpdateDownloaded: (callback: (version: string) => void) => () => void;

  openUrl: (url: string) => Promise<void>;
  selectDatabase: () => Promise<Response<DBSelector>>;
  openDatabase: () => Promise<Response<DBSelector>>;
  initializeDatabase: (data: {
    postgresConfig?: PostgresConfig;
    dbType: DatabaseType;
    fullPath?: string;
    mode?: DBInitType;
  }) => Promise<Response<unknown>>;
  getDatabaseList: () => Promise<Response<string[]>>;
  testConnection: (data: PostgresConfig) => Promise<Response<unknown>>;

  getAllSettings: () => Promise<Response<Settings>>;
  updateSettings: (data: SettingsUpdate) => Promise<Response<SettingsUpdate>>;

  getAllBusinesses: (filter?: FilterData[]) => Promise<Response<Business[]>>;
  updateBusiness: (data: BusinessUpdate) => Promise<Response<Business>>;
  deleteBusiness: (id: number) => Promise<Response<unknown>>;
  addBusiness: (data: BusinessAdd) => Promise<Response<Business>>;
  addBatchBusiness: (data: BusinessAdd[]) => Promise<Response<Business[]>>;

  getAllStyleProfiles: (filter?: FilterData[]) => Promise<Response<StyleProfile[]>>;
  updateStyleProfile: (data: StyleProfileUpdate) => Promise<Response<StyleProfile>>;
  deleteStyleProfile: (id: number) => Promise<Response<unknown>>;
  addStyleProfile: (data: StyleProfileAdd) => Promise<Response<StyleProfile>>;
  addBatchStyleProfile: (data: StyleProfileAdd[]) => Promise<Response<StyleProfile[]>>;

  getAllLayouts: (filter?: FilterData[]) => Promise<Response<Layout[]>>;
  updateLayout: (data: LayoutUpdate) => Promise<Response<Layout>>;
  deleteLayout: (id: number) => Promise<Response<unknown>>;
  addLayout: (data: LayoutAdd) => Promise<Response<Layout>>;
  exportLayout: (id: number) => Promise<Response<ExportMeta>>;

  getAllClients: (filter?: FilterData[]) => Promise<Response<Client[]>>;
  updateClient: (data: ClientUpdate) => Promise<Response<Client>>;
  deleteClient: (id: number) => Promise<Response<unknown>>;
  addClient: (data: ClientAdd) => Promise<Response<Client>>;
  addBatchClient: (data: ClientAdd[]) => Promise<Response<Client[]>>;

  getAllItems: (filter?: FilterData[]) => Promise<Response<Item[]>>;
  updateItem: (data: ItemUpdate) => Promise<Response<Item>>;
  deleteItem: (id: number) => Promise<Response<unknown>>;
  addItem: (data: ItemAdd) => Promise<Response<Item>>;
  addBatchItem: (data: ItemAdd[]) => Promise<Response<Item[]>>;

  getAllUnits: (filter?: FilterData[]) => Promise<Response<Unit[]>>;
  updateUnit: (data: UnitUpdate) => Promise<Response<Unit>>;
  deleteUnit: (id: number) => Promise<Response<unknown>>;
  addUnit: (data: UnitAdd) => Promise<Response<Unit>>;
  addBatchUnit: (data: UnitAdd[]) => Promise<Response<Unit[]>>;

  getAllCategories: (filter?: FilterData[]) => Promise<Response<Category[]>>;
  updateCategory: (data: CategoryUpdate) => Promise<Response<Category>>;
  deleteCategory: (id: number) => Promise<Response<unknown>>;
  addCategory: (data: CategoryAdd) => Promise<Response<Category>>;
  addBatchCategory: (data: CategoryAdd[]) => Promise<Response<Category[]>>;

  getAllCurrencies: (filter?: FilterData[]) => Promise<Response<Currency[]>>;
  updateCurrency: (data: CurrencyUpdate) => Promise<Response<Currency>>;
  deleteCurrency: (id: number) => Promise<Response<unknown>>;
  addCurrency: (data: CurrencyAdd) => Promise<Response<Currency>>;
  addBatchCurrency: (data: CurrencyAdd[]) => Promise<Response<Currency[]>>;

  getNextSequence: (data: {
    businessId: number;
    clientId: number;
    invoiceType: InvoiceType;
  }) => Promise<Response<NextSequenceData | undefined>>;
  getEInvoiceXML: (data: { invoiceId: number; einvoice: EInvoice }) => Promise<Response<Uint8Array | undefined>>;
  getCustomHeaders: (type: InvoiceType) => Promise<Response<CustomFieldMeta[]>>;
  getAllInvoices: (type?: InvoiceType, filter?: FilterData[]) => Promise<Response<Invoice[]>>;
  deleteInvoice: (id: number) => Promise<Response<unknown>>;
  addInvoice: (data: InvoiceAdd) => Promise<Response<Invoice>>;
  updateInvoice: (data: InvoiceUpdate) => Promise<Response<Invoice>>;
  duplicateInvoice: (id: number, invoiceType: InvoiceType) => Promise<Response<Invoice>>;

  getAllBanks: (filter?: FilterData[]) => Promise<Response<Bank[]>>;
  updateBank: (data: BankUpdate) => Promise<Response<Bank>>;
  deleteBank: (id: number) => Promise<Response<unknown>>;
  addBank: (data: BankAdd) => Promise<Response<Bank>>;
  addBatchBank: (data: BankAdd[]) => Promise<Response<Bank[]>>;

  getAllPresets: (filter?: FilterData[]) => Promise<Response<Preset[]>>;
  updatePreset: (data: PresetUpdate) => Promise<Response<Preset>>;
  deletePreset: (id: number) => Promise<Response<unknown>>;
  addPreset: (data: PresetAdd) => Promise<Response<Preset>>;
  addBatchPreset: (data: PresetAdd[]) => Promise<Response<Preset[]>>;

  exportAllData: () => Promise<Response<ExportMeta>>;
  importAllData: () => Promise<Response<unknown>>;

  printReceipt: (html: string) => Promise<Response<unknown>>;
}
