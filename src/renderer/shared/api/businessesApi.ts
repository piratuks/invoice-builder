import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { Business, BusinessAdd, BusinessUpdate } from '../types/business';
import type { FilterData } from '../types/filter';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface BusinessesApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type BusinessesBaseQueryArgs =
  | { type: 'getBusinesses'; filter?: FilterData[] }
  | { type: 'addBusiness'; body: BusinessAdd }
  | { type: 'addBusinessesBatch'; body: BusinessAdd[] }
  | { type: 'updateBusiness'; body: BusinessUpdate }
  | { type: 'deleteBusiness'; id: number };

const businessesBaseQuery: BaseQueryFn<BusinessesBaseQueryArgs, unknown, BusinessesApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getBusinesses':
        response = await getApi().getAllBusinesses(args.filter);
        break;
      case 'addBusiness':
        response = await getApi().addBusiness(args.body);
        break;
      case 'addBusinessesBatch':
        response = await getApi().addBatchBusiness(args.body);
        break;
      case 'updateBusiness':
        response = await getApi().updateBusiness(args.body);
        break;
      case 'deleteBusiness':
        response = await getApi().deleteBusiness(args.id);
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

export const businessesApi = createApi({
  reducerPath: 'businessesApi',
  baseQuery: businessesBaseQuery,
  tagTypes: ['Business'],
  endpoints: builder => ({
    getBusinesses: builder.query<Business[], FilterData[] | void>({
      query: filter => ({ type: 'getBusinesses', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [
              { type: 'Business' as const, id: 'LIST' },
              ...result.map(item => ({ type: 'Business' as const, id: item.id }))
            ]
          : [{ type: 'Business' as const, id: 'LIST' }]
    }),
    addBusiness: builder.mutation<Business, BusinessAdd>({
      query: body => ({ type: 'addBusiness', body }),
      invalidatesTags: [{ type: 'Business', id: 'LIST' }]
    }),
    addBusinessesBatch: builder.mutation<Business[], BusinessAdd[]>({
      query: body => ({ type: 'addBusinessesBatch', body }),
      invalidatesTags: [{ type: 'Business', id: 'LIST' }]
    }),
    updateBusiness: builder.mutation<Business, BusinessUpdate>({
      query: body => ({ type: 'updateBusiness', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Business', id: 'LIST' },
        { type: 'Business', id: arg.id }
      ]
    }),
    deleteBusiness: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteBusiness', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Business', id: 'LIST' },
        { type: 'Business', id }
      ]
    })
  })
});

export const {
  useGetBusinessesQuery,
  useAddBusinessMutation,
  useAddBusinessesBatchMutation,
  useUpdateBusinessMutation,
  useDeleteBusinessMutation
} = businessesApi;
