import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FilterData } from '../types/filter';
import type { Item, ItemAdd, ItemUpdate } from '../types/item';
import type { Response } from '../types/response';
import { categoriesApi } from './categoriesApi';
import { getApi } from './restApi';
import { unitsApi } from './unitsApi';

export interface ItemsApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type ItemsBaseQueryArgs =
  | { type: 'getItems'; filter?: FilterData[] }
  | { type: 'addItem'; body: ItemAdd }
  | { type: 'addItemsBatch'; body: ItemAdd[] }
  | { type: 'updateItem'; body: ItemUpdate }
  | { type: 'deleteItem'; id: number };

const itemsBaseQuery: BaseQueryFn<ItemsBaseQueryArgs, unknown, ItemsApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getItems':
        response = await getApi().getAllItems(args.filter);
        break;
      case 'addItem':
        response = await getApi().addItem(args.body);
        break;
      case 'addItemsBatch':
        response = await getApi().addBatchItem(args.body);
        break;
      case 'updateItem':
        response = await getApi().updateItem(args.body);
        break;
      case 'deleteItem':
        response = await getApi().deleteItem(args.id);
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

export const itemsApi = createApi({
  reducerPath: 'itemsApi',
  baseQuery: itemsBaseQuery,
  tagTypes: ['Item'],
  endpoints: builder => ({
    getItems: builder.query<Item[], FilterData[] | void>({
      query: filter => ({ type: 'getItems', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [{ type: 'Item' as const, id: 'LIST' }, ...result.map(item => ({ type: 'Item' as const, id: item.id }))]
          : [{ type: 'Item' as const, id: 'LIST' }]
    }),
    addItem: builder.mutation<Item, ItemAdd>({
      query: body => ({ type: 'addItem', body }),
      invalidatesTags: [{ type: 'Item', id: 'LIST' }]
    }),
    addItemsBatch: builder.mutation<Item[], ItemAdd[]>({
      query: body => ({ type: 'addItemsBatch', body }),
      invalidatesTags: [{ type: 'Item', id: 'LIST' }],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(categoriesApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }]));
          dispatch(unitsApi.util.invalidateTags([{ type: 'Unit', id: 'LIST' }]));
        } catch {
          return;
        }
      }
    }),
    updateItem: builder.mutation<Item, ItemUpdate>({
      query: body => ({ type: 'updateItem', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Item', id: 'LIST' },
        { type: 'Item', id: arg.id }
      ]
    }),
    deleteItem: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteItem', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Item', id: 'LIST' },
        { type: 'Item', id }
      ]
    })
  })
});

export const {
  useGetItemsQuery,
  useAddItemMutation,
  useAddItemsBatchMutation,
  useUpdateItemMutation,
  useDeleteItemMutation
} = itemsApi;
