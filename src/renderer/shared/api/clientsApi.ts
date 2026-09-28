import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { Client, ClientAdd, ClientUpdate } from '../types/client';
import type { FilterData } from '../types/filter';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface ClientsApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type ClientsBaseQueryArgs =
  | { type: 'getClients'; filter?: FilterData[] }
  | { type: 'addClient'; body: ClientAdd }
  | { type: 'addClientsBatch'; body: ClientAdd[] }
  | { type: 'updateClient'; body: ClientUpdate }
  | { type: 'deleteClient'; id: number };

const clientsBaseQuery: BaseQueryFn<ClientsBaseQueryArgs, unknown, ClientsApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getClients':
        response = await getApi().getAllClients(args.filter);
        break;
      case 'addClient':
        response = await getApi().addClient(args.body);
        break;
      case 'addClientsBatch':
        response = await getApi().addBatchClient(args.body);
        break;
      case 'updateClient':
        response = await getApi().updateClient(args.body);
        break;
      case 'deleteClient':
        response = await getApi().deleteClient(args.id);
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

export const clientsApi = createApi({
  reducerPath: 'clientsApi',
  baseQuery: clientsBaseQuery,
  tagTypes: ['Client'],
  endpoints: builder => ({
    getClients: builder.query<Client[], FilterData[] | void>({
      query: filter => ({ type: 'getClients', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [{ type: 'Client' as const, id: 'LIST' }, ...result.map(item => ({ type: 'Client' as const, id: item.id }))]
          : [{ type: 'Client' as const, id: 'LIST' }]
    }),
    addClient: builder.mutation<Client, ClientAdd>({
      query: body => ({ type: 'addClient', body }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }]
    }),
    addClientsBatch: builder.mutation<Client[], ClientAdd[]>({
      query: body => ({ type: 'addClientsBatch', body }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }]
    }),
    updateClient: builder.mutation<Client, ClientUpdate>({
      query: body => ({ type: 'updateClient', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Client', id: 'LIST' },
        { type: 'Client', id: arg.id }
      ]
    }),
    deleteClient: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteClient', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Client', id: 'LIST' },
        { type: 'Client', id }
      ]
    })
  })
});

export const {
  useGetClientsQuery,
  useAddClientMutation,
  useAddClientsBatchMutation,
  useUpdateClientMutation,
  useDeleteClientMutation
} = clientsApi;
