import type { EInvoice } from '../renderer/shared/enums/einvoice';
import type { Settings, SettingsUpdate } from '../types/settings';
import type { DatabaseType } from './../enums/databaseType';
import type { DBInitType } from './../enums/dbInitType';
import type { InvoiceType } from './../enums/invoiceType';
import type { Bank, BankAdd, BankUpdate } from './bank';
import type { Business, BusinessAdd, BusinessUpdate } from './business';
import type { Category, CategoryAdd, CategoryUpdate } from './category';
import type { Client, ClientAdd, ClientUpdate } from './client';
import type { Currency, CurrencyAdd, CurrencyUpdate } from './currency';
import type { DBSelector } from './dbSelector';
import type { ExportMeta } from './exportMeta';
import type { FilterData } from './filter';
import type { CustomFieldMeta, Invoice, InvoiceAdd, InvoiceUpdate, NextSequenceData } from './invoice';
import type { Item, ItemAdd, ItemUpdate } from './item';
import type { PostgresConfig } from './postgresConfig';
import type { Preset, PresetAdd, PresetUpdate } from './preset';
import type { Response } from './response';
import type { StyleProfile, StyleProfileAdd, StyleProfileUpdate } from './styleProfiles';
import type { Unit, UnitAdd, UnitUpdate } from './unit';
import type { ProgressInfo } from './updater';

declare global {
  interface Window {
    electronAPI: {
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
    };
  }
}

export {};
