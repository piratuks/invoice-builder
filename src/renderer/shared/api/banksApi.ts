import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { Bank, BankAdd, BankUpdate } from '../types/bank';
import type { FilterData } from '../types/filter';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface BanksApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type BanksBaseQueryArgs =
  | { type: 'getBanks'; filter?: FilterData[] }
  | { type: 'addBank'; body: BankAdd }
  | { type: 'addBanksBatch'; body: BankAdd[] }
  | { type: 'updateBank'; body: BankUpdate }
  | { type: 'deleteBank'; id: number };

const banksBaseQuery: BaseQueryFn<BanksBaseQueryArgs, unknown, BanksApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getBanks':
        response = await getApi().getAllBanks(args.filter);
        break;
      case 'addBank':
        response = await getApi().addBank(args.body);
        break;
      case 'addBanksBatch':
        response = await getApi().addBatchBank(args.body);
        break;
      case 'updateBank':
        response = await getApi().updateBank(args.body);
        break;
      case 'deleteBank':
        response = await getApi().deleteBank(args.id);
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

export const banksApi = createApi({
  reducerPath: 'banksApi',
  baseQuery: banksBaseQuery,
  tagTypes: ['Bank'],
  endpoints: builder => ({
    getBanks: builder.query<Bank[], FilterData[] | void>({
      query: filter => ({ type: 'getBanks', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [{ type: 'Bank' as const, id: 'LIST' }, ...result.map(item => ({ type: 'Bank' as const, id: item.id }))]
          : [{ type: 'Bank' as const, id: 'LIST' }]
    }),
    addBank: builder.mutation<Bank, BankAdd>({
      query: body => ({ type: 'addBank', body }),
      invalidatesTags: [{ type: 'Bank', id: 'LIST' }]
    }),
    addBanksBatch: builder.mutation<Bank[], BankAdd[]>({
      query: body => ({ type: 'addBanksBatch', body }),
      invalidatesTags: [{ type: 'Bank', id: 'LIST' }]
    }),
    updateBank: builder.mutation<Bank, BankUpdate>({
      query: body => ({ type: 'updateBank', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Bank', id: 'LIST' },
        { type: 'Bank', id: arg.id }
      ]
    }),
    deleteBank: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteBank', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Bank', id: 'LIST' },
        { type: 'Bank', id }
      ]
    })
  })
});

export const {
  useGetBanksQuery,
  useAddBankMutation,
  useAddBanksBatchMutation,
  useUpdateBankMutation,
  useDeleteBankMutation
} = banksApi;
