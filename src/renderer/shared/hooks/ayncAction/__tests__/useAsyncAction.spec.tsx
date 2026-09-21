import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { useAsyncAction } from '../useAsyncAction';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('useAsyncAction', () => {
  beforeEach(() => {
    document.body.style.cursor = '';
  });

  it('toggles the loading cursor while showLoader is enabled', async () => {
    const asyncFn = vi.fn().mockResolvedValue('done');
    const { result } = renderHook(() => useAsyncAction(asyncFn), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(document.body.style.cursor).toBe('default');
  });

  it('does not toggle the loading cursor when showLoader is false', async () => {
    const asyncFn = vi.fn().mockResolvedValue('done');
    document.body.style.cursor = 'auto';
    const { result } = renderHook(() => useAsyncAction(asyncFn, { showLoader: false }), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(document.body.style.cursor).toBe('auto');
  });

  it('calls onDone once loading finishes with data', async () => {
    const asyncFn = vi.fn().mockResolvedValue('done');
    const onDone = vi.fn();
    const { result } = renderHook(() => useAsyncAction(asyncFn, { onDone }), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(onDone).toHaveBeenCalledWith('done');
  });

  it('dispatches a toast with the raw error message when not a translation key', async () => {
    const error = new Error('Something went wrong');
    const asyncFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useAsyncAction(asyncFn), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    const toasts = store.getState().pageSlice.toasts;
    expect(toasts.some(toast => toast.message === 'Something went wrong')).toBe(true);
  });

  it('dispatches a translated toast message when the error message is a translation key', async () => {
    const error = new Error('error.unknownError');
    const asyncFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useAsyncAction(asyncFn), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    const toasts = store.getState().pageSlice.toasts;
    const translated = i18n.t('error.unknownError');
    expect(toasts.some(toast => toast.message === translated)).toBe(true);
  });

  it('does not run automatically when immediate is false, and can be triggered manually', async () => {
    const asyncFn = vi.fn().mockResolvedValue('done');
    const { result } = renderHook(() => useAsyncAction(asyncFn, { immediate: false }), { wrapper });

    expect(asyncFn).not.toHaveBeenCalled();
    act(() => {
      result.current.execute();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    act(() => {
      store
        .getState()
        .pageSlice.toasts.forEach(toast => store.dispatch({ type: 'pageSlice/removeToast', payload: toast.id }));
    });
  });
});
