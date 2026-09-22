import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FilterData } from '../types/filter';
import type { Preset, PresetAdd, PresetUpdate } from '../types/preset';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface PresetsApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type PresetsBaseQueryArgs =
  | { type: 'getPresets'; filter?: FilterData[] }
  | { type: 'addPreset'; body: PresetAdd }
  | { type: 'addPresetsBatch'; body: PresetAdd[] }
  | { type: 'updatePreset'; body: PresetUpdate }
  | { type: 'deletePreset'; id: number };

const presetsBaseQuery: BaseQueryFn<PresetsBaseQueryArgs, unknown, PresetsApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getPresets':
        response = await getApi().getAllPresets(args.filter);
        break;
      case 'addPreset':
        response = await getApi().addPreset(args.body);
        break;
      case 'addPresetsBatch':
        response = await getApi().addBatchPreset(args.body);
        break;
      case 'updatePreset':
        response = await getApi().updatePreset(args.body);
        break;
      case 'deletePreset':
        response = await getApi().deletePreset(args.id);
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

export const presetsApi = createApi({
  reducerPath: 'presetsApi',
  baseQuery: presetsBaseQuery,
  tagTypes: ['Preset'],
  endpoints: builder => ({
    getPresets: builder.query<Preset[], FilterData[] | void>({
      query: filter => ({ type: 'getPresets', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [{ type: 'Preset' as const, id: 'LIST' }, ...result.map(item => ({ type: 'Preset' as const, id: item.id }))]
          : [{ type: 'Preset' as const, id: 'LIST' }]
    }),
    addPreset: builder.mutation<Preset, PresetAdd>({
      query: body => ({ type: 'addPreset', body }),
      invalidatesTags: [{ type: 'Preset', id: 'LIST' }]
    }),
    addPresetsBatch: builder.mutation<Preset[], PresetAdd[]>({
      query: body => ({ type: 'addPresetsBatch', body }),
      invalidatesTags: [{ type: 'Preset', id: 'LIST' }]
    }),
    updatePreset: builder.mutation<Preset, PresetUpdate>({
      query: body => ({ type: 'updatePreset', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Preset', id: 'LIST' },
        { type: 'Preset', id: arg.id }
      ]
    }),
    deletePreset: builder.mutation<unknown, number>({
      query: id => ({ type: 'deletePreset', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Preset', id: 'LIST' },
        { type: 'Preset', id }
      ]
    })
  })
});

export const {
  useGetPresetsQuery,
  useAddPresetMutation,
  useAddPresetsBatchMutation,
  useUpdatePresetMutation,
  useDeletePresetMutation
} = presetsApi;
