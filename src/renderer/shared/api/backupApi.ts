import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { ExportMeta } from '../types/exportMeta';
import type { Response } from '../types/response';
import { banksApi } from './banksApi';
import { businessesApi } from './businessesApi';
import { categoriesApi } from './categoriesApi';
import { clientsApi } from './clientsApi';
import { currenciesApi } from './currenciesApi';
import { invoicesApi } from './invoicesApi';
import { itemsApi } from './itemsApi';
import { layoutsApi } from './layoutsApi';
import { presetsApi } from './presetsApi';
import { getApi } from './restApi';
import { settingsApi } from './settingsApi';
import { styleProfilesApi } from './styleProfilesApi';
import { unitsApi } from './unitsApi';

export interface BackupApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type BackupBaseQueryArgs = { type: 'exportAllData' } | { type: 'importAllData' };

const backupBaseQuery: BaseQueryFn<BackupBaseQueryArgs, unknown, BackupApiError> = async args => {
  try {
    const response: Response<unknown> =
      args.type === 'exportAllData' ? await getApi().exportAllData() : await getApi().importAllData();

    if (!response.success) {
      return { error: { kind: 'response', message: response.message, key: response.key } };
    }

    return { data: response.data };
  } catch (err) {
    return { error: { kind: 'exception', message: err instanceof Error ? err.message : String(err) } };
  }
};

export const backupApi = createApi({
  reducerPath: 'backupApi',
  baseQuery: backupBaseQuery,
  endpoints: builder => ({
    exportAllData: builder.mutation<ExportMeta, void>({
      query: () => ({ type: 'exportAllData' })
    }),
    importAllData: builder.mutation<unknown, void>({
      query: () => ({ type: 'importAllData' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(businessesApi.util.invalidateTags([{ type: 'Business', id: 'LIST' }]));
          dispatch(banksApi.util.invalidateTags([{ type: 'Bank', id: 'LIST' }]));
          dispatch(categoriesApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }]));
          dispatch(clientsApi.util.invalidateTags([{ type: 'Client', id: 'LIST' }]));
          dispatch(currenciesApi.util.invalidateTags([{ type: 'Currency', id: 'LIST' }]));
          dispatch(itemsApi.util.invalidateTags([{ type: 'Item', id: 'LIST' }]));
          dispatch(invoicesApi.util.invalidateTags([{ type: 'Invoice', id: 'LIST' }]));
          dispatch(layoutsApi.util.invalidateTags([{ type: 'Layout', id: 'LIST' }]));
          dispatch(presetsApi.util.invalidateTags([{ type: 'Preset', id: 'LIST' }]));
          dispatch(settingsApi.util.invalidateTags([{ type: 'Settings', id: 'SINGLETON' }]));
          dispatch(styleProfilesApi.util.invalidateTags([{ type: 'StyleProfile', id: 'LIST' }]));
          dispatch(unitsApi.util.invalidateTags([{ type: 'Unit', id: 'LIST' }]));
        } catch {
          return;
        }
      }
    })
  })
});

export const { useExportAllDataMutation, useImportAllDataMutation } = backupApi;
