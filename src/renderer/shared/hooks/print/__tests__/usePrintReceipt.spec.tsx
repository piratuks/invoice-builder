import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { isWebMode } from '../../../api/restApi';
import { InvoiceType } from '../../../enums/invoiceType';
import type { InvoiceFromData } from '../../../types/invoice';
import type { Settings } from '../../../types/settings';
import { usePrintReceipt } from '../usePrintReceipt';

vi.mock('../../../api/restApi', async () => {
  const actual = await vi.importActual<typeof import('../../../api/restApi')>('../../../api/restApi');
  return { ...actual, isWebMode: vi.fn() };
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const invoiceForm = {
  invoiceType: InvoiceType.invoice,
  invoiceNumber: '001',
  issuedAt: '2024-01-15',
  invoiceCurrencySnapshot: { currencyCode: 'USD', currencySymbol: '$', currencySubunit: 100 },
  invoiceItems: []
} as unknown as InvoiceFromData;

const storeSettings = { amountFormat: 'en-US', dateFormat: 'MM/dd/yyyy' } as unknown as Settings;

describe('usePrintReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // @ts-expect-error - cleaning up test-only global
    delete window.electronAPI;
  });

  it('does nothing when invoiceForm or storeSettings are missing', async () => {
    vi.mocked(isWebMode).mockReturnValue(true);
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const { result } = renderHook(() => usePrintReceipt({}), { wrapper });

    await act(async () => {
      await result.current.printReceipt();
    });
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('does nothing in electron mode when printReceipt is not exposed', async () => {
    vi.mocked(isWebMode).mockReturnValue(false);
    const { result } = renderHook(() => usePrintReceipt({ invoiceForm, storeSettings }), { wrapper });

    await act(async () => {
      await result.current.printReceipt();
    });
  });

  it('opens a print window in web mode and succeeds', async () => {
    vi.mocked(isWebMode).mockReturnValue(true);
    const printWindow = { document: { open: vi.fn(), write: vi.fn(), close: vi.fn() }, focus: vi.fn(), print: vi.fn() };
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);

    const { result } = renderHook(() => usePrintReceipt({ invoiceForm, storeSettings }), { wrapper });
    await act(async () => {
      await result.current.printReceipt();
    });

    expect(openSpy).toHaveBeenCalledWith('', '_blank');
    expect(printWindow.document.write).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('dispatches an error toast when the print window fails to open', async () => {
    vi.mocked(isWebMode).mockReturnValue(true);
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    const { result } = renderHook(() => usePrintReceipt({ invoiceForm, storeSettings }), { wrapper });
    await act(async () => {
      await result.current.printReceipt();
    });

    const toasts = store.getState().pageSlice.toasts;
    expect(toasts.some(toast => toast.message === 'Unable to open print window')).toBe(true);
    openSpy.mockRestore();
  });

  it('calls the electron printReceipt API when not in web mode', async () => {
    vi.mocked(isWebMode).mockReturnValue(false);
    const printReceipt = vi.fn().mockResolvedValue({ success: true });
    Object.defineProperty(window, 'electronAPI', { value: { printReceipt }, configurable: true });

    const { result } = renderHook(() => usePrintReceipt({ invoiceForm, storeSettings }), { wrapper });
    await act(async () => {
      await result.current.printReceipt();
    });

    expect(printReceipt).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
  });

  it('dispatches a translated toast when electron printReceipt fails with a key', async () => {
    vi.mocked(isWebMode).mockReturnValue(false);
    const printReceipt = vi.fn().mockResolvedValue({ success: false, key: 'error.printFailed' });
    Object.defineProperty(window, 'electronAPI', { value: { printReceipt }, configurable: true });

    const { result } = renderHook(() => usePrintReceipt({ invoiceForm, storeSettings }), { wrapper });
    await act(async () => {
      await result.current.printReceipt();
    });

    const toasts = store.getState().pageSlice.toasts;
    expect(toasts.some(toast => toast.message === i18n.t('error.printFailed'))).toBe(true);
  });

  it('dispatches a default error toast when the failure has no message or key', async () => {
    vi.mocked(isWebMode).mockReturnValue(false);
    const printReceipt = vi.fn().mockResolvedValue({ success: false });
    Object.defineProperty(window, 'electronAPI', { value: { printReceipt }, configurable: true });

    const { result } = renderHook(() => usePrintReceipt({ invoiceForm, storeSettings }), { wrapper });
    await act(async () => {
      await result.current.printReceipt();
    });

    const toasts = store.getState().pageSlice.toasts;
    expect(toasts.some(toast => toast.message === i18n.t('error.printFailed'))).toBe(true);
  });

  it('dispatches an error toast when the electron API throws', async () => {
    vi.mocked(isWebMode).mockReturnValue(false);
    const printReceipt = vi.fn().mockRejectedValue(new Error('boom'));
    Object.defineProperty(window, 'electronAPI', { value: { printReceipt }, configurable: true });

    const { result } = renderHook(() => usePrintReceipt({ invoiceForm, storeSettings }), { wrapper });
    await act(async () => {
      await result.current.printReceipt();
    });

    const toasts = store.getState().pageSlice.toasts;
    expect(toasts.some(toast => toast.message === 'boom')).toBe(true);
  });
});
