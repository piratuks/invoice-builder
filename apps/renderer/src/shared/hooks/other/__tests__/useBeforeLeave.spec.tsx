import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { store } from '../../../../state/configureStore';
import { selectAllowed } from '../../../../state/pageSlice';
import { useBeforeLeave } from '../useBeforeLeave';

const wrapperFor =
  () =>
  ({ children }: { children: ReactNode }) => {
    const router = createMemoryRouter([{ path: '/', element: children }], { initialEntries: ['/'] });
    return (
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    );
  };

describe('useBeforeLeave', () => {
  it('starts unblocked when allowedToLeave is true and updates the store', async () => {
    const { result } = renderHook(() => useBeforeLeave(true), { wrapper: wrapperFor() });

    expect(result.current.blocked).toBe(false);
    await waitFor(() => expect(selectAllowed(store.getState())).toBe(true));
  });

  it('starts blocked when allowedToLeave is false and updates the store', async () => {
    const { result } = renderHook(() => useBeforeLeave(false), { wrapper: wrapperFor() });

    expect(result.current.blocked).toBe(true);
    await waitFor(() => expect(selectAllowed(store.getState())).toBe(false));
  });

  it('runs the action immediately via attemptNavigation when not blocked', () => {
    const { result } = renderHook(() => useBeforeLeave(true), { wrapper: wrapperFor() });
    const action = vi.fn();

    act(() => {
      result.current.attemptNavigation(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.showPrompt).toBe(false);
  });

  it('defers the action and shows a prompt via attemptNavigation when blocked', () => {
    const { result } = renderHook(() => useBeforeLeave(false), { wrapper: wrapperFor() });
    const action = vi.fn();

    act(() => {
      result.current.attemptNavigation(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.showPrompt).toBe(true);
  });

  it('runs the pending action and unblocks on confirmNavigation', () => {
    const { result } = renderHook(() => useBeforeLeave(false), { wrapper: wrapperFor() });
    const action = vi.fn();

    act(() => {
      result.current.attemptNavigation(action);
    });
    act(() => {
      result.current.confirmNavigation();
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.blocked).toBe(false);
    expect(result.current.showPrompt).toBe(false);
  });

  it('discards the pending action and hides the prompt on cancelNavigation', () => {
    const { result } = renderHook(() => useBeforeLeave(false), { wrapper: wrapperFor() });
    const action = vi.fn();

    act(() => {
      result.current.attemptNavigation(action);
    });
    act(() => {
      result.current.cancelNavigation();
    });

    expect(result.current.showPrompt).toBe(false);
    act(() => {
      result.current.confirmNavigation();
    });
    expect(action).not.toHaveBeenCalled();
  });

  it('allows manually setting the blocked flag', () => {
    const { result } = renderHook(() => useBeforeLeave(true), { wrapper: wrapperFor() });

    act(() => {
      result.current.setBlocked(true);
    });
    expect(result.current.blocked).toBe(true);
  });
});
