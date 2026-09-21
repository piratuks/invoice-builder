import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { selectBusinessesSnapshotsOptions, selectClientsSnapshotsOptions } from '../../../../state/pageSlice';
import { getApi } from '../../../api/restApi';
import { EInvoice } from '../../../enums/einvoice';
import { InvoiceType } from '../../../enums/invoiceType';
import { useGetEInvoiceXML } from '../useGetEInvoiceXML';
import { useGetNextSequence } from '../useGetNextSequence';
import { useHeadersRetrieve } from '../useHeadersRetrieve';
import { useInvoiceAdd } from '../useInvoiceAdd';
import { useInvoiceDelete } from '../useInvoiceDelete';
import { useInvoiceDuplicate } from '../useInvoiceDuplicate';
import { useInvoicesRetrieve } from '../useInvoicesRetrieve';
import { useInvoiceUpdate } from '../useInvoiceUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('invoice hooks', () => {
  const mockApi = {
    addInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
    duplicateInvoice: vi.fn(),
    getAllInvoices: vi.fn(),
    getNextSequence: vi.fn(),
    getEInvoiceXML: vi.fn(),
    getCustomHeaders: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useInvoiceAdd', () => {
    it('adds an invoice and unwraps the response data', async () => {
      mockApi.addInvoice.mockResolvedValue({ success: true, data: { id: 1, invoiceNumber: 'INV-1' } });
      const { result } = renderHook(() => useInvoiceAdd({ invoice: { invoiceType: InvoiceType.invoice } as never }), {
        wrapper
      });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addInvoice).toHaveBeenCalledWith({ invoiceType: InvoiceType.invoice });
      expect(result.current.data).toEqual({ id: 1, invoiceNumber: 'INV-1' });
    });

    it('resolves to undefined data when no invoice is provided', async () => {
      const { result } = renderHook(() => useInvoiceAdd({ invoice: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addInvoice).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useInvoiceUpdate', () => {
    it('updates an invoice and returns the full response', async () => {
      mockApi.updateInvoice.mockResolvedValue({ success: true, data: { id: 1, invoiceNumber: 'INV-2' } });
      const { result } = renderHook(
        () => useInvoiceUpdate({ invoice: { id: 1, invoiceType: InvoiceType.invoice } as never }),
        { wrapper }
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateInvoice).toHaveBeenCalledWith({ id: 1, invoiceType: InvoiceType.invoice });
      expect(result.current.data?.data?.invoiceNumber).toBe('INV-2');
    });

    it('resolves to a failure result when no invoice is provided', async () => {
      const { result } = renderHook(() => useInvoiceUpdate({ invoice: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateInvoice).not.toHaveBeenCalled();
    });
  });

  describe('useInvoiceDelete', () => {
    it('deletes an invoice by id', async () => {
      mockApi.deleteInvoice.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useInvoiceDelete({ id: 10 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteInvoice).toHaveBeenCalledWith(10);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useInvoiceDuplicate', () => {
    it('duplicates an invoice and unwraps the response data', async () => {
      mockApi.duplicateInvoice.mockResolvedValue({ success: true, data: { id: 2, invoiceNumber: 'INV-1-copy' } });
      const { result } = renderHook(() => useInvoiceDuplicate({ id: 1, invoiceType: InvoiceType.invoice }), {
        wrapper
      });
      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.duplicateInvoice).toHaveBeenCalledWith(1, InvoiceType.invoice);
      expect(result.current.data).toEqual({ id: 2, invoiceNumber: 'INV-1-copy' });
    });
  });

  describe('useInvoicesRetrieve', () => {
    it('retrieves invoices, defaults to an empty array and syncs snapshot options', async () => {
      mockApi.getAllInvoices.mockResolvedValue({
        success: true,
        data: [
          {
            id: 1,
            invoiceBusinessSnapshot: { businessName: 'Acme' },
            invoiceClientSnapshot: { clientName: 'Client A' }
          }
        ]
      });
      const { result } = renderHook(() => useInvoicesRetrieve({ type: InvoiceType.invoice }), { wrapper });

      await waitFor(() => expect(result.current.invoices).toHaveLength(1));
      expect(mockApi.getAllInvoices).toHaveBeenCalledWith(InvoiceType.invoice, undefined);
      await waitFor(() =>
        expect(selectBusinessesSnapshotsOptions(store.getState())).toEqual([{ label: 'Acme', value: 'Acme' }])
      );
      expect(selectClientsSnapshotsOptions(store.getState())).toEqual([{ label: 'Client A', value: 'Client A' }]);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllInvoices.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useInvoicesRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllInvoices).toHaveBeenCalled());
      expect(result.current.invoices).toEqual([]);
    });

    it('falls back to N/A for missing business/client snapshot names', async () => {
      mockApi.getAllInvoices.mockResolvedValue({
        success: true,
        data: [{ id: 1, invoiceBusinessSnapshot: undefined, invoiceClientSnapshot: undefined }]
      });
      renderHook(() => useInvoicesRetrieve({}), { wrapper });
      await waitFor(() =>
        expect(selectBusinessesSnapshotsOptions(store.getState())).toEqual([{ label: 'N/A', value: 'N/A' }])
      );
    });
  });

  describe('useGetNextSequence', () => {
    it('retrieves the next invoice sequence', async () => {
      mockApi.getNextSequence.mockResolvedValue({
        success: true,
        data: { nextSequence: 5, formattedSequence: '005' }
      });
      const seqData = { businessId: 1, clientId: 2, invoiceType: InvoiceType.invoice };
      const { result } = renderHook(() => useGetNextSequence({ seqData }), { wrapper });

      await waitFor(() => expect(result.current.sequence?.nextSequence).toBe(5));
      expect(mockApi.getNextSequence).toHaveBeenCalledWith(seqData);
    });
  });

  describe('useGetEInvoiceXML', () => {
    it('retrieves e-invoice XML bytes when params are provided', async () => {
      const bytes = new Uint8Array([1, 2, 3]);
      mockApi.getEInvoiceXML.mockResolvedValue({ success: true, data: bytes });
      const params = { invoiceId: 1, einvoice: EInvoice.ubl21 };
      const { result } = renderHook(() => useGetEInvoiceXML({ params }), { wrapper });

      await waitFor(() => expect(result.current.data).toEqual(bytes));
      expect(mockApi.getEInvoiceXML).toHaveBeenCalledWith(params);
    });

    it('resolves to undefined data when no params are provided', async () => {
      const { result } = renderHook(() => useGetEInvoiceXML({ params: undefined }), { wrapper });
      await waitFor(() => expect(mockApi.getEInvoiceXML).not.toHaveBeenCalled());
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useHeadersRetrieve', () => {
    it('retrieves custom headers for the given invoice type', async () => {
      mockApi.getCustomHeaders.mockResolvedValue({ success: true, data: [{ key: 'field1', label: 'Field 1' }] });
      const { result } = renderHook(() => useHeadersRetrieve({ type: InvoiceType.invoice }), { wrapper });

      await waitFor(() => expect(result.current.invoices).toHaveLength(1));
      expect(mockApi.getCustomHeaders).toHaveBeenCalledWith(InvoiceType.invoice);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getCustomHeaders.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useHeadersRetrieve({ type: InvoiceType.quotation }), { wrapper });
      await waitFor(() => expect(mockApi.getCustomHeaders).toHaveBeenCalled());
      expect(result.current.invoices).toEqual([]);
    });
  });
});
