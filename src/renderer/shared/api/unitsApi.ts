import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FilterData } from '../types/filter';
import type { Response } from '../types/response';
import type { Unit, UnitAdd, UnitUpdate } from '../types/unit';
import { getApi } from './restApi';

export interface UnitsApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type UnitsBaseQueryArgs =
  | { type: 'getUnits'; filter?: FilterData[] }
  | { type: 'addUnit'; body: UnitAdd }
  | { type: 'addUnitsBatch'; body: UnitAdd[] }
  | { type: 'updateUnit'; body: UnitUpdate }
  | { type: 'deleteUnit'; id: number };

const unitsBaseQuery: BaseQueryFn<UnitsBaseQueryArgs, unknown, UnitsApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getUnits':
        response = await getApi().getAllUnits(args.filter);
        break;
      case 'addUnit':
        response = await getApi().addUnit(args.body);
        break;
      case 'addUnitsBatch':
        response = await getApi().addBatchUnit(args.body);
        break;
      case 'updateUnit':
        response = await getApi().updateUnit(args.body);
        break;
      case 'deleteUnit':
        response = await getApi().deleteUnit(args.id);
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

export const unitsApi = createApi({
  reducerPath: 'unitsApi',
  baseQuery: unitsBaseQuery,
  tagTypes: ['Unit'],
  endpoints: builder => ({
    getUnits: builder.query<Unit[], FilterData[] | void>({
      query: filter => ({ type: 'getUnits', filter: filter ?? undefined }),
      providesTags: result =>
        result
          ? [{ type: 'Unit' as const, id: 'LIST' }, ...result.map(item => ({ type: 'Unit' as const, id: item.id }))]
          : [{ type: 'Unit' as const, id: 'LIST' }]
    }),
    addUnit: builder.mutation<Unit, UnitAdd>({
      query: body => ({ type: 'addUnit', body }),
      invalidatesTags: [{ type: 'Unit', id: 'LIST' }]
    }),
    addUnitsBatch: builder.mutation<Unit[], UnitAdd[]>({
      query: body => ({ type: 'addUnitsBatch', body }),
      invalidatesTags: [{ type: 'Unit', id: 'LIST' }]
    }),
    updateUnit: builder.mutation<Unit, UnitUpdate>({
      query: body => ({ type: 'updateUnit', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Unit', id: 'LIST' },
        { type: 'Unit', id: arg.id }
      ]
    }),
    deleteUnit: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteUnit', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Unit', id: 'LIST' },
        { type: 'Unit', id }
      ]
    })
  })
});

export const {
  useGetUnitsQuery,
  useAddUnitMutation,
  useAddUnitsBatchMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation
} = unitsApi;
