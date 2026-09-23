import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { DatabaseType } from '../enums/databaseType';
import type { DBInitType } from '../enums/dbInitType';
import type { DBSelector } from '../types/dbSelector';
import type { PostgresConfig } from '../types/postgresConfig';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface DBSelectorApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

export interface InitializeDatabaseArgs {
  fullPath?: string;
  mode?: DBInitType;
  dbType: DatabaseType;
  postgresConfig?: PostgresConfig;
}

type DBSelectorBaseQueryArgs =
  | { type: 'getDatabaseList' }
  | { type: 'selectDatabase' }
  | { type: 'openDatabase' }
  | { type: 'initializeDatabase'; body: InitializeDatabaseArgs }
  | { type: 'testConnection'; body: PostgresConfig };

const dbSelectorBaseQuery: BaseQueryFn<DBSelectorBaseQueryArgs, unknown, DBSelectorApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getDatabaseList':
        response = await getApi().getDatabaseList();
        break;
      case 'selectDatabase':
        response = await getApi().selectDatabase();
        break;
      case 'openDatabase':
        response = await getApi().openDatabase();
        break;
      case 'initializeDatabase':
        response = await getApi().initializeDatabase(args.body);
        break;
      case 'testConnection':
        response = await getApi().testConnection(args.body);
        break;
    }

    if (!response.success) {
      return { error: { kind: 'response', message: response.message, key: response.key } };
    }

    return { data: response.data };
  } catch (err) {
    return { error: { kind: 'exception', message: err instanceof Error ? err.message : String(err) } };
  }
};

export const dbSelectorApi = createApi({
  reducerPath: 'dbSelectorApi',
  baseQuery: dbSelectorBaseQuery,
  endpoints: builder => ({
    getDatabaseList: builder.query<string[], void>({
      query: () => ({ type: 'getDatabaseList' })
    }),
    selectDatabase: builder.mutation<DBSelector, void>({
      query: () => ({ type: 'selectDatabase' })
    }),
    openDatabase: builder.mutation<DBSelector, void>({
      query: () => ({ type: 'openDatabase' })
    }),
    initializeDatabase: builder.mutation<unknown, InitializeDatabaseArgs>({
      query: body => ({ type: 'initializeDatabase', body })
    }),
    testConnection: builder.mutation<unknown, PostgresConfig>({
      query: body => ({ type: 'testConnection', body })
    })
  })
});

export const {
  useLazyGetDatabaseListQuery,
  useSelectDatabaseMutation,
  useOpenDatabaseMutation,
  useInitializeDatabaseMutation,
  useTestConnectionMutation
} = dbSelectorApi;
