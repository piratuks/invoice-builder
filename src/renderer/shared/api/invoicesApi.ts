import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { EInvoice } from '../enums/einvoice';
import type { InvoiceType } from '../enums/invoiceType';
import type { FilterData } from '../types/filter';
import type { CustomFieldMeta, Invoice, InvoiceAdd, InvoiceUpdate, NextSequenceData } from '../types/invoice';
import type { Response } from '../types/response';
import { getApi } from './restApi';

export interface InvoicesApiError {
  kind: 'response' | 'exception';
  message?: string;
  key?: string;
}

type InvoicesBaseQueryArgs =
  | { type: 'getInvoices'; invoiceType?: InvoiceType; filter?: FilterData[] }
  | { type: 'addInvoice'; body: InvoiceAdd }
  | { type: 'updateInvoice'; body: InvoiceUpdate }
  | { type: 'deleteInvoice'; id: number }
  | { type: 'duplicateInvoice'; id: number; invoiceType: InvoiceType }
  | { type: 'getNextSequence'; body: { businessId: number; clientId: number; invoiceType: InvoiceType } }
  | { type: 'getEInvoiceXML'; body: { invoiceId: number; einvoice: EInvoice } }
  | { type: 'getCustomHeaders'; invoiceType: InvoiceType };

const invoicesBaseQuery: BaseQueryFn<InvoicesBaseQueryArgs, unknown, InvoicesApiError> = async args => {
  try {
    let response: Response<unknown>;
    switch (args.type) {
      case 'getInvoices':
        response = await getApi().getAllInvoices(args.invoiceType, args.filter);
        break;
      case 'addInvoice':
        response = await getApi().addInvoice(args.body);
        break;
      case 'updateInvoice':
        response = await getApi().updateInvoice(args.body);
        break;
      case 'deleteInvoice':
        response = await getApi().deleteInvoice(args.id);
        break;
      case 'duplicateInvoice':
        response = await getApi().duplicateInvoice(args.id, args.invoiceType);
        break;
      case 'getNextSequence':
        response = await getApi().getNextSequence(args.body);
        break;
      case 'getEInvoiceXML':
        response = await getApi().getEInvoiceXML(args.body);
        break;
      case 'getCustomHeaders':
        response = await getApi().getCustomHeaders(args.invoiceType);
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

export const invoicesApi = createApi({
  reducerPath: 'invoicesApi',
  baseQuery: invoicesBaseQuery,
  tagTypes: ['Invoice'],
  endpoints: builder => ({
    getInvoices: builder.query<Invoice[], { invoiceType?: InvoiceType; filter?: FilterData[] } | void>({
      query: args => ({ type: 'getInvoices', invoiceType: args?.invoiceType, filter: args?.filter }),
      providesTags: result =>
        result
          ? [
              { type: 'Invoice' as const, id: 'LIST' },
              ...result.map(invoice => ({ type: 'Invoice' as const, id: invoice.id }))
            ]
          : [{ type: 'Invoice' as const, id: 'LIST' }]
    }),
    addInvoice: builder.mutation<Invoice, InvoiceAdd>({
      query: body => ({ type: 'addInvoice', body }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }]
    }),
    updateInvoice: builder.mutation<Invoice, InvoiceUpdate>({
      query: body => ({ type: 'updateInvoice', body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Invoice', id: 'LIST' },
        { type: 'Invoice', id: arg.id }
      ]
    }),
    deleteInvoice: builder.mutation<unknown, number>({
      query: id => ({ type: 'deleteInvoice', id }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Invoice', id: 'LIST' },
        { type: 'Invoice', id }
      ]
    }),
    duplicateInvoice: builder.mutation<Invoice, { id: number; invoiceType: InvoiceType }>({
      query: body => ({ type: 'duplicateInvoice', id: body.id, invoiceType: body.invoiceType }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }]
    }),
    getNextSequence: builder.query<
      NextSequenceData | undefined,
      { businessId: number; clientId: number; invoiceType: InvoiceType }
    >({
      query: body => ({ type: 'getNextSequence', body })
    }),
    getEInvoiceXML: builder.query<Uint8Array | undefined, { invoiceId: number; einvoice: EInvoice }>({
      query: body => ({ type: 'getEInvoiceXML', body })
    }),
    getCustomHeaders: builder.query<CustomFieldMeta[], InvoiceType>({
      query: invoiceType => ({ type: 'getCustomHeaders', invoiceType })
    })
  })
});

export const {
  useGetInvoicesQuery,
  useAddInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useDuplicateInvoiceMutation,
  useLazyGetNextSequenceQuery,
  useLazyGetEInvoiceXMLQuery,
  useGetCustomHeadersQuery
} = invoicesApi;
