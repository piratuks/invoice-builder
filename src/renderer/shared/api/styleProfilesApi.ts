import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FilterData } from '../types/filter';
import type { Response } from '../types/response';
import type { StyleProfile, StyleProfileAdd, StyleProfileUpdate } from '../types/styleProfiles';
import { getApi } from './restApi';

export interface StyleProfilesApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type StyleProfilesBaseQueryArgs =
  | { type: 'getStyleProfiles'; filter?: FilterData[] }
  | { type: 'addStyleProfile'; body: StyleProfileAdd }
  | { type: 'addStyleProfilesBatch'; body: StyleProfileAdd[] }
  | { type: 'updateStyleProfile'; body: StyleProfileUpdate }
  | { type: 'deleteStyleProfile'; id: number };

const styleProfilesBaseQuery: BaseQueryFn<StyleProfilesBaseQueryArgs, unknown, StyleProfilesApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getStyleProfiles':
        response = await getApi().getAllStyleProfiles(args.filter);
        break;
      case 'addStyleProfile':
        response = await getApi().addStyleProfile(args.body);
        break;
      case 'addStyleProfilesBatch':
        response = await getApi().addBatchStyleProfile(args.body);
        break;
      case 'updateStyleProfile':
        response = await getApi().updateStyleProfile(args.body);
        break;
      case 'deleteStyleProfile':
        response = await getApi().deleteStyleProfile(args.id);
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

export const styleProfilesApi = createApi({
  reducerPath: 'styleProfilesApi',
  baseQuery: styleProfilesBaseQuery,
  tagTypes: ['StyleProfile'],
  endpoints: builder => ({
    getStyleProfiles: builder.query<StyleProfile[], FilterData[] | void>({
      query: filter => ({ type: 'getStyleProfiles', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [
              { type: 'StyleProfile' as const, id: 'LIST' },
              ...result.map(item => ({ type: 'StyleProfile' as const, id: item.id }))
            ]
          : [{ type: 'StyleProfile' as const, id: 'LIST' }]
    }),
    addStyleProfile: builder.mutation<StyleProfile, StyleProfileAdd>({
      query: body => ({ type: 'addStyleProfile', body }),
      invalidatesTags: [{ type: 'StyleProfile', id: 'LIST' }]
    }),
    addStyleProfilesBatch: builder.mutation<StyleProfile[], StyleProfileAdd[]>({
      query: body => ({ type: 'addStyleProfilesBatch', body }),
      invalidatesTags: [{ type: 'StyleProfile', id: 'LIST' }]
    }),
    updateStyleProfile: builder.mutation<StyleProfile, StyleProfileUpdate>({
      query: body => ({ type: 'updateStyleProfile', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'StyleProfile', id: 'LIST' },
        { type: 'StyleProfile', id: arg.id }
      ]
    }),
    deleteStyleProfile: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteStyleProfile', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'StyleProfile', id: 'LIST' },
        { type: 'StyleProfile', id }
      ]
    })
  })
});

export const {
  useGetStyleProfilesQuery,
  useAddStyleProfileMutation,
  useAddStyleProfilesBatchMutation,
  useUpdateStyleProfileMutation,
  useDeleteStyleProfileMutation
} = styleProfilesApi;
