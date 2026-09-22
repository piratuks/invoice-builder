import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { Response } from '../types/response';
import type { Settings, SettingsUpdate } from '../types/settings';
import { getApi } from './restApi';

export interface SettingsApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type SettingsBaseQueryArgs = { type: 'getSettings' } | { type: 'updateSettings'; body: SettingsUpdate };

const settingsBaseQuery: BaseQueryFn<SettingsBaseQueryArgs, unknown, SettingsApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getSettings':
        response = await getApi().getAllSettings();
        break;
      case 'updateSettings':
        response = await getApi().updateSettings(args.body);
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

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: settingsBaseQuery,
  tagTypes: ['Settings'],
  endpoints: builder => ({
    getSettings: builder.query<Settings, void>({
      query: () => ({ type: 'getSettings' }),
      providesTags: [{ type: 'Settings', id: 'SINGLETON' }]
    }),
    // Not tag-invalidating: routine settings toggles auto-persist without triggering a refetch,
    // since local Redux state (pageSlice.settings) is already the source of truth for the UI.
    updateSettings: builder.mutation<Settings, SettingsUpdate>({
      query: body => ({ type: 'updateSettings', body })
    })
  })
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
