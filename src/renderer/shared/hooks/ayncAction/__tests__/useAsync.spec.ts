import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsync } from '../useAsync';

describe('useAsync', () => {
  it('executes immediately by default and stores the result', async () => {
    const asyncFn = vi.fn().mockResolvedValue('done');
    const { result } = renderHook(() => useAsync(asyncFn));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe('done');
    expect(result.current.error).toBeNull();
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it('does not execute automatically when immediate is false', () => {
    const asyncFn = vi.fn().mockResolvedValue('done');
    const { result } = renderHook(() => useAsync(asyncFn, { immediate: false }));

    expect(result.current.loading).toBe(false);
    expect(asyncFn).not.toHaveBeenCalled();
  });

  it('captures errors and invokes onError', async () => {
    const error = new Error('boom');
    const asyncFn = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    const { result } = renderHook(() => useAsync(asyncFn, { onError }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(error);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('reports loading changes via onLoadingChange', async () => {
    const asyncFn = vi.fn().mockResolvedValue('done');
    const onLoadingChange = vi.fn();
    const { result } = renderHook(() => useAsync(asyncFn, { onLoadingChange }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(onLoadingChange).toHaveBeenCalledWith(true);
    expect(onLoadingChange).toHaveBeenCalledWith(false);
  });

  it('supports manual re-execution with arguments', async () => {
    const asyncFn = vi.fn().mockResolvedValue('done');
    const { result } = renderHook(() => useAsync(asyncFn, { immediate: false }));

    act(() => {
      result.current.execute('arg1', 2);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(asyncFn).toHaveBeenCalledWith('arg1', 2);
    expect(result.current.data).toBe('done');
  });
});
