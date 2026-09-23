import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { backupApi, useExportAllDataMutation, useImportAllDataMutation } from '../backupApi';
import { invoicesApi, useGetInvoicesQuery } from '../invoicesApi';
import { getApi } from '../restApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('backupApi', () => {
  const mockApi = {
    exportAllData: vi.fn(),
    importAllData: vi.fn(),
    getAllInvoices: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(backupApi.util.resetApiState());
    store.dispatch(invoicesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('exports backup metadata and normalizes export errors', async () => {
    mockApi.exportAllData.mockResolvedValue({ success: true, data: { filePath: 'backup.json' } });
    const exportMutation = renderHook(() => useExportAllDataMutation(), { wrapper });
    const response = await exportMutation.result.current[0]();
    expect(response).toEqual({ data: { filePath: 'backup.json' } });
    expect(mockApi.exportAllData).toHaveBeenCalledTimes(1);

    mockApi.exportAllData.mockResolvedValue({ success: false, message: 'export failed' });
    const failed = await exportMutation.result.current[0]();
    expect(failed).toEqual({ error: { kind: 'response', message: 'export failed', key: undefined } });
  });

  it('invalidates invoice queries after a successful import', async () => {
    mockApi.getAllInvoices.mockResolvedValueOnce({ success: true, data: [] });
    const invoices = renderHook(() => useGetInvoicesQuery({ invoiceType: 'invoice' as never }), { wrapper });
    await waitFor(() => expect(invoices.result.current.isSuccess).toBe(true));

    mockApi.importAllData.mockResolvedValue({ success: true, data: undefined });
    mockApi.getAllInvoices.mockResolvedValueOnce({ success: true, data: [{ id: 9 }] });
    const importMutation = renderHook(() => useImportAllDataMutation(), { wrapper });
    await importMutation.result.current[0]();

    await waitFor(() => expect(mockApi.getAllInvoices).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(invoices.result.current.data).toEqual([{ id: 9 }]));
  });
});
