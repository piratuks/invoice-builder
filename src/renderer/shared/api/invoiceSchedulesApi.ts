import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type {
  InvoiceSchedule,
  InvoiceScheduleAdd,
  InvoiceScheduleRun,
  InvoiceScheduleUpdate
} from '../types/invoiceSchedule';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface InvoiceSchedulesApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type InvoiceSchedulesBaseQueryArgs =
  | { type: 'getInvoiceSchedules' }
  | { type: 'getInvoiceScheduleRuns'; scheduleId: number }
  | { type: 'addInvoiceSchedule'; body: InvoiceScheduleAdd }
  | { type: 'updateInvoiceSchedule'; body: InvoiceScheduleUpdate }
  | { type: 'deleteInvoiceSchedule'; id: number };

const invoiceSchedulesBaseQuery: BaseQueryFn<
  InvoiceSchedulesBaseQueryArgs,
  unknown,
  InvoiceSchedulesApiError
> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getInvoiceSchedules':
        response = await getApi().getAllInvoiceSchedules();
        break;
      case 'getInvoiceScheduleRuns':
        response = await getApi().getInvoiceScheduleRuns(args.scheduleId);
        break;
      case 'addInvoiceSchedule':
        response = await getApi().addInvoiceSchedule(args.body);
        break;
      case 'updateInvoiceSchedule':
        response = await getApi().updateInvoiceSchedule(args.body);
        break;
      case 'deleteInvoiceSchedule':
        response = await getApi().deleteInvoiceSchedule(args.id);
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

export const invoiceSchedulesApi = createApi({
  reducerPath: 'invoiceSchedulesApi',
  baseQuery: invoiceSchedulesBaseQuery,
  tagTypes: ['InvoiceSchedule', 'InvoiceScheduleRun'],
  endpoints: builder => ({
    getInvoiceSchedules: builder.query<InvoiceSchedule[], void>({
      query: () => ({ type: 'getInvoiceSchedules' }),
      providesTags: result =>
        result
          ? [
              { type: 'InvoiceSchedule' as const, id: 'LIST' },
              ...result.map(schedule => ({ type: 'InvoiceSchedule' as const, id: schedule.id }))
            ]
          : [{ type: 'InvoiceSchedule' as const, id: 'LIST' }]
    }),
    getInvoiceScheduleRuns: builder.query<InvoiceScheduleRun[], number>({
      query: scheduleId => ({ type: 'getInvoiceScheduleRuns', scheduleId }),
      providesTags: (_result, _error, scheduleId) => [{ type: 'InvoiceScheduleRun', id: scheduleId }]
    }),
    addInvoiceSchedule: builder.mutation<InvoiceSchedule, InvoiceScheduleAdd>({
      query: body => ({ type: 'addInvoiceSchedule', body }),
      invalidatesTags: [{ type: 'InvoiceSchedule', id: 'LIST' }]
    }),
    updateInvoiceSchedule: builder.mutation<InvoiceSchedule, InvoiceScheduleUpdate>({
      query: body => ({ type: 'updateInvoiceSchedule', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'InvoiceSchedule', id: 'LIST' },
        { type: 'InvoiceSchedule', id: arg.id },
        { type: 'InvoiceScheduleRun', id: arg.id }
      ]
    }),
    deleteInvoiceSchedule: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteInvoiceSchedule', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'InvoiceSchedule', id: 'LIST' },
        { type: 'InvoiceSchedule', id },
        { type: 'InvoiceScheduleRun', id }
      ]
    })
  })
});

export const {
  useGetInvoiceSchedulesQuery,
  useGetInvoiceScheduleRunsQuery,
  useAddInvoiceScheduleMutation,
  useUpdateInvoiceScheduleMutation,
  useDeleteInvoiceScheduleMutation
} = invoiceSchedulesApi;
