import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { ExportMeta } from '../types/exportMeta';
import type { FilterData } from '../types/filter';
import type { Layout, LayoutAdd, LayoutUpdate } from '../types/layouts';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface LayoutsApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type LayoutsBaseQueryArgs =
  | { type: 'getLayouts'; filter?: FilterData[] }
  | { type: 'addLayout'; body: LayoutAdd }
  | { type: 'updateLayout'; body: LayoutUpdate }
  | { type: 'deleteLayout'; id: number }
  | { type: 'exportLayout'; id: number };

const layoutsBaseQuery: BaseQueryFn<LayoutsBaseQueryArgs, unknown, LayoutsApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getLayouts':
        response = await getApi().getAllLayouts(args.filter);
        break;
      case 'addLayout':
        response = await getApi().addLayout(args.body);
        break;
      case 'updateLayout':
        response = await getApi().updateLayout(args.body);
        break;
      case 'deleteLayout':
        response = await getApi().deleteLayout(args.id);
        break;
      case 'exportLayout':
        response = await getApi().exportLayout(args.id);
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

export const layoutsApi = createApi({
  reducerPath: 'layoutsApi',
  baseQuery: layoutsBaseQuery,
  tagTypes: ['Layout'],
  endpoints: builder => ({
    getLayouts: builder.query<Layout[], FilterData[] | void>({
      query: filter => ({ type: 'getLayouts', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [{ type: 'Layout' as const, id: 'LIST' }, ...result.map(item => ({ type: 'Layout' as const, id: item.id }))]
          : [{ type: 'Layout' as const, id: 'LIST' }]
    }),
    addLayout: builder.mutation<Layout, LayoutAdd>({
      query: body => ({ type: 'addLayout', body }),
      invalidatesTags: [{ type: 'Layout', id: 'LIST' }]
    }),
    updateLayout: builder.mutation<Layout, LayoutUpdate>({
      query: body => ({ type: 'updateLayout', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Layout', id: 'LIST' },
        { type: 'Layout', id: arg.id }
      ]
    }),
    deleteLayout: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteLayout', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Layout', id: 'LIST' },
        { type: 'Layout', id }
      ]
    }),
    exportLayout: builder.mutation<ExportMeta, number>({
      query: id => ({ type: 'exportLayout', id })
    })
  })
});

export const {
  useGetLayoutsQuery,
  useAddLayoutMutation,
  useUpdateLayoutMutation,
  useDeleteLayoutMutation,
  useExportLayoutMutation
} = layoutsApi;
