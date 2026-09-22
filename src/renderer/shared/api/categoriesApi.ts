import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { Category, CategoryAdd, CategoryUpdate } from '../types/category';
import type { FilterData } from '../types/filter';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface CategoriesApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type CategoriesBaseQueryArgs =
  | { type: 'getCategories'; filter?: FilterData[] }
  | { type: 'addCategory'; body: CategoryAdd }
  | { type: 'addCategoriesBatch'; body: CategoryAdd[] }
  | { type: 'updateCategory'; body: CategoryUpdate }
  | { type: 'deleteCategory'; id: number };

const categoriesBaseQuery: BaseQueryFn<CategoriesBaseQueryArgs, unknown, CategoriesApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getCategories':
        response = await getApi().getAllCategories(args.filter);
        break;
      case 'addCategory':
        response = await getApi().addCategory(args.body);
        break;
      case 'addCategoriesBatch':
        response = await getApi().addBatchCategory(args.body);
        break;
      case 'updateCategory':
        response = await getApi().updateCategory(args.body);
        break;
      case 'deleteCategory':
        response = await getApi().deleteCategory(args.id);
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

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: categoriesBaseQuery,
  tagTypes: ['Category'],
  endpoints: builder => ({
    getCategories: builder.query<Category[], FilterData[] | void>({
      query: filter => ({ type: 'getCategories', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [
              { type: 'Category' as const, id: 'LIST' },
              ...result.map(item => ({ type: 'Category' as const, id: item.id }))
            ]
          : [{ type: 'Category' as const, id: 'LIST' }]
    }),
    addCategory: builder.mutation<Category, CategoryAdd>({
      query: body => ({ type: 'addCategory', body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }]
    }),
    addCategoriesBatch: builder.mutation<Category[], CategoryAdd[]>({
      query: body => ({ type: 'addCategoriesBatch', body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }]
    }),
    updateCategory: builder.mutation<Category, CategoryUpdate>({
      query: body => ({ type: 'updateCategory', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: arg.id }
      ]
    }),
    deleteCategory: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteCategory', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id }
      ]
    })
  })
});

export const {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useAddCategoriesBatchMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} = categoriesApi;
