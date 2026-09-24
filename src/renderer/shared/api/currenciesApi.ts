import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { Currency, CurrencyAdd, CurrencyUpdate } from '../types/currency';
import type { FilterData } from '../types/filter';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface CurrenciesApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type CurrenciesBaseQueryArgs =
  | { type: 'getCurrencies'; filter?: FilterData[] }
  | { type: 'addCurrency'; body: CurrencyAdd }
  | { type: 'addCurrenciesBatch'; body: CurrencyAdd[] }
  | { type: 'updateCurrency'; body: CurrencyUpdate }
  | { type: 'deleteCurrency'; id: number };

const currenciesBaseQuery: BaseQueryFn<CurrenciesBaseQueryArgs, unknown, CurrenciesApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getCurrencies':
        response = await getApi().getAllCurrencies(args.filter);
        break;
      case 'addCurrency':
        response = await getApi().addCurrency(args.body);
        break;
      case 'addCurrenciesBatch':
        response = await getApi().addBatchCurrency(args.body);
        break;
      case 'updateCurrency':
        response = await getApi().updateCurrency(args.body);
        break;
      case 'deleteCurrency':
        response = await getApi().deleteCurrency(args.id);
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

export const currenciesApi = createApi({
  reducerPath: 'currenciesApi',
  baseQuery: currenciesBaseQuery,
  tagTypes: ['Currency'],
  endpoints: builder => ({
    getCurrencies: builder.query<Currency[], FilterData[] | void>({
      query: filter => ({ type: 'getCurrencies', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [
              { type: 'Currency' as const, id: 'LIST' },
              ...result.map(item => ({ type: 'Currency' as const, id: item.id }))
            ]
          : [{ type: 'Currency' as const, id: 'LIST' }]
    }),
    addCurrency: builder.mutation<Currency, CurrencyAdd>({
      query: body => ({ type: 'addCurrency', body }),
      invalidatesTags: [{ type: 'Currency', id: 'LIST' }]
    }),
    addCurrenciesBatch: builder.mutation<Currency[], CurrencyAdd[]>({
      query: body => ({ type: 'addCurrenciesBatch', body }),
      invalidatesTags: [{ type: 'Currency', id: 'LIST' }]
    }),
    updateCurrency: builder.mutation<Currency, CurrencyUpdate>({
      query: body => ({ type: 'updateCurrency', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Currency', id: 'LIST' },
        { type: 'Currency', id: arg.id }
      ]
    }),
    deleteCurrency: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteCurrency', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Currency', id: 'LIST' },
        { type: 'Currency', id }
      ]
    })
  })
});

export const {
  useGetCurrenciesQuery,
  useAddCurrencyMutation,
  useAddCurrenciesBatchMutation,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation
} = currenciesApi;
