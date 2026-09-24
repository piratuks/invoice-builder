import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { EInvoice } from '../../enums/einvoice';
import { InvoiceType } from '../../enums/invoiceType';
import {
  invoicesApi,
  useAddInvoiceMutation,
  useDeleteInvoiceMutation,
  useDuplicateInvoiceMutation,
  useGetCustomHeadersQuery,
  useGetInvoicesQuery,
  useLazyGetEInvoiceXMLQuery,
  useLazyGetNextSequenceQuery,
  useUpdateInvoiceMutation
} from '../invoicesApi';
import { getApi } from '../restApi';
import { runApiTrigger } from './testUtils';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('invoicesApi', () => {
  const mockApi = {
    getAllInvoices: vi.fn(),
    addInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
    duplicateInvoice: vi.fn(),
    getNextSequence: vi.fn(),
    getEInvoiceXML: vi.fn(),
    getCustomHeaders: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(invoicesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('retrieves filtered invoices and passes type/filter to the platform API', async () => {
    const filter = [{ type: 'status', value: 'paid' }] as never;
    mockApi.getAllInvoices.mockResolvedValue({ success: true, data: [{ id: 1, invoiceType: InvoiceType.invoice }] });

    const { result } = renderHook(() => useGetInvoicesQuery({ invoiceType: InvoiceType.invoice, filter }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getAllInvoices).toHaveBeenCalledWith(InvoiceType.invoice, filter);
    expect(result.current.data).toEqual([{ id: 1, invoiceType: InvoiceType.invoice }]);
  });

  it('normalizes response and exception errors', async () => {
    mockApi.getAllInvoices.mockResolvedValueOnce({ success: false, key: 'error.loadFailed' });
    const responseError = renderHook(() => useGetInvoicesQuery({ invoiceType: InvoiceType.invoice }), { wrapper });
    await waitFor(() => expect(responseError.result.current.isError).toBe(true));
    expect(responseError.result.current.error).toEqual({
      kind: 'response',
      message: undefined,
      key: 'error.loadFailed'
    });

    responseError.unmount();
    store.dispatch(invoicesApi.util.resetApiState());
    mockApi.getAllInvoices.mockRejectedValueOnce(new Error('offline'));
    const exceptionError = renderHook(() => useGetInvoicesQuery({ invoiceType: InvoiceType.invoice }), { wrapper });
    await waitFor(() => expect(exceptionError.result.current.isError).toBe(true));
    expect(exceptionError.result.current.error).toEqual({ kind: 'exception', message: 'offline' });
  });

  it('invalidates the invoice list after adding an invoice', async () => {
    mockApi.getAllInvoices.mockResolvedValueOnce({ success: true, data: [] });
    const query = renderHook(() => useGetInvoicesQuery({ invoiceType: InvoiceType.invoice }), { wrapper });
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

    mockApi.getAllInvoices.mockResolvedValueOnce({ success: true, data: [{ id: 2 }] });
    mockApi.addInvoice.mockResolvedValue({ success: true, data: { id: 2 } });
    const mutation = renderHook(() => useAddInvoiceMutation(), { wrapper });
    await runApiTrigger(() => mutation.result.current[0]({ invoiceType: InvoiceType.invoice } as never));

    await waitFor(() => expect(mockApi.getAllInvoices).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(query.result.current.data).toEqual([{ id: 2 }]));
  });

  it('routes update, delete, and duplicate mutations with their required arguments', async () => {
    mockApi.updateInvoice.mockResolvedValue({ success: true, data: { id: 3 } });
    mockApi.deleteInvoice.mockResolvedValue({ success: true });
    mockApi.duplicateInvoice.mockResolvedValue({ success: true, data: { id: 4 } });

    const update = renderHook(() => useUpdateInvoiceMutation(), { wrapper });
    const remove = renderHook(() => useDeleteInvoiceMutation(), { wrapper });
    const duplicate = renderHook(() => useDuplicateInvoiceMutation(), { wrapper });

    await runApiTrigger(() => update.result.current[0]({ id: 3 } as never));
    await runApiTrigger(() => remove.result.current[0](3));
    await runApiTrigger(() => duplicate.result.current[0]({ id: 3, invoiceType: InvoiceType.quotation }));

    expect(mockApi.updateInvoice).toHaveBeenCalledWith({ id: 3 });
    expect(mockApi.deleteInvoice).toHaveBeenCalledWith(3);
    expect(mockApi.duplicateInvoice).toHaveBeenCalledWith(3, InvoiceType.quotation);
  });

  it('supports sequence, headers, and XML endpoints', async () => {
    mockApi.getNextSequence.mockResolvedValue({ success: true, data: { formattedSequence: 'INV-4' } });
    mockApi.getCustomHeaders.mockResolvedValue({ success: true, data: [{ header: 'PO' }] });
    mockApi.getEInvoiceXML.mockResolvedValue({ success: true, data: new Uint8Array([1, 2]) });

    const sequence = renderHook(() => useLazyGetNextSequenceQuery(), { wrapper });
    const headers = renderHook(() => useGetCustomHeadersQuery(InvoiceType.invoice), { wrapper });
    const xml = renderHook(() => useLazyGetEInvoiceXMLQuery(), { wrapper });

    await runApiTrigger(() =>
      sequence.result.current[0]({ businessId: 1, clientId: 2, invoiceType: InvoiceType.invoice }).unwrap()
    );
    const xmlResponse = await runApiTrigger(() =>
      xml.result.current[0]({ invoiceId: 9, einvoice: EInvoice.ubl21 }).unwrap()
    );
    await waitFor(() => expect(headers.result.current.isSuccess).toBe(true));
    expect(mockApi.getNextSequence).toHaveBeenCalledWith({
      businessId: 1,
      clientId: 2,
      invoiceType: InvoiceType.invoice
    });
    expect(mockApi.getCustomHeaders).toHaveBeenCalledWith(InvoiceType.invoice);
    expect(mockApi.getEInvoiceXML).toHaveBeenCalledWith({ invoiceId: 9, einvoice: EInvoice.ubl21 });
    expect(xmlResponse).toEqual(new Uint8Array([1, 2]));
  });
});
