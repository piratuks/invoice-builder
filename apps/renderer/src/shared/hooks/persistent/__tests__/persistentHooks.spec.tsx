import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SortType } from '../../../enums/sortType';
import { usePersistentFilters } from '../usePersistentFilters';
import { usePersistentSearch } from '../usePersistentSearch';
import { usePersistentSort } from '../usePersistentSort';

const wrapperFor =
  (path: string) =>
  ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>;

describe('usePersistentFilters', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('falls back to the initial filters when nothing is stored', () => {
    const initial = [{ type: 'All' } as never];
    const { result } = renderHook(() => usePersistentFilters(initial, 'list'), { wrapper: wrapperFor('/clients') });
    expect(result.current[0]).toEqual(initial);
  });

  it('persists updates to localStorage scoped by page and component id', () => {
    const initial = [{ type: 'All' } as never];
    const { result } = renderHook(() => usePersistentFilters(initial, 'list'), { wrapper: wrapperFor('/clients') });

    act(() => {
      result.current[1]([{ type: 'Active' } as never]);
    });
    expect(result.current[0]).toEqual([{ type: 'Active' }]);

    const stored = JSON.parse(localStorage.getItem('pageFilters')!);
    expect(stored['clients:list']).toEqual([{ type: 'Active' }]);
  });

  it('reads previously persisted filters for the matching page/component', () => {
    localStorage.setItem('pageFilters', JSON.stringify({ 'clients:list': [{ type: 'Archived' }] }));
    const { result } = renderHook(() => usePersistentFilters([{ type: 'All' } as never], 'list'), {
      wrapper: wrapperFor('/clients')
    });
    expect(result.current[0]).toEqual([{ type: 'Archived' }]);
  });

  it('falls back to initial filters when stored JSON is malformed', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('pageFilters', 'not-json');
    const initial = [{ type: 'All' } as never];
    const { result } = renderHook(() => usePersistentFilters(initial, 'list'), { wrapper: wrapperFor('/clients') });
    expect(result.current[0]).toEqual(initial);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('logs and continues when saving to localStorage fails', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const { result } = renderHook(() => usePersistentFilters([{ type: 'All' } as never], 'list'), {
      wrapper: wrapperFor('/clients')
    });
    act(() => {
      result.current[1]([{ type: 'Active' } as never]);
    });

    expect(errorSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

describe('usePersistentSearch', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('falls back to the initial search term when nothing is stored', () => {
    const { result } = renderHook(() => usePersistentSearch('', 'list'), { wrapper: wrapperFor('/items') });
    expect(result.current[0]).toBe('');
  });

  it('persists updates scoped by page and component id', () => {
    const { result } = renderHook(() => usePersistentSearch('', 'list'), { wrapper: wrapperFor('/items') });
    act(() => {
      result.current[1]('widget');
    });
    expect(result.current[0]).toBe('widget');
    const stored = JSON.parse(localStorage.getItem('pageSearch')!);
    expect(stored['items:list']).toBe('widget');
  });

  it('reads previously persisted search terms', () => {
    localStorage.setItem('pageSearch', JSON.stringify({ 'items:list': 'gadget' }));
    const { result } = renderHook(() => usePersistentSearch('', 'list'), { wrapper: wrapperFor('/items') });
    expect(result.current[0]).toBe('gadget');
  });

  it('falls back to initial search when stored JSON is malformed', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('pageSearch', 'not-json');
    const { result } = renderHook(() => usePersistentSearch('default', 'list'), { wrapper: wrapperFor('/items') });
    expect(result.current[0]).toBe('default');
    errorSpy.mockRestore();
  });
});

describe('usePersistentSort', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const initialSort = { activeSort: SortType.ASC, activeSortBy: { label: 'Name', value: 'name' } };

  it('falls back to the initial sort when nothing is stored', () => {
    const { result } = renderHook(() => usePersistentSort(initialSort, 'list'), { wrapper: wrapperFor('/units') });
    expect(result.current[0]).toEqual(initialSort);
  });

  it('persists updates scoped by page and component id', () => {
    const { result } = renderHook(() => usePersistentSort(initialSort, 'list'), { wrapper: wrapperFor('/units') });
    const newSort = { activeSort: SortType.DESC, activeSortBy: { label: 'Qty', value: 'qty' } };
    act(() => {
      result.current[1](newSort);
    });
    expect(result.current[0]).toEqual(newSort);
    const stored = JSON.parse(localStorage.getItem('pageSort')!);
    expect(stored['units:list']).toEqual(newSort);
  });

  it('reads previously persisted sort state', () => {
    const persisted = { activeSort: SortType.DESC, activeSortBy: { label: 'Qty', value: 'qty' } };
    localStorage.setItem('pageSort', JSON.stringify({ 'units:list': persisted }));
    const { result } = renderHook(() => usePersistentSort(initialSort, 'list'), { wrapper: wrapperFor('/units') });
    expect(result.current[0]).toEqual(persisted);
  });

  it('falls back to initial sort when stored JSON is malformed', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('pageSort', 'not-json');
    const { result } = renderHook(() => usePersistentSort(initialSort, 'list'), { wrapper: wrapperFor('/units') });
    expect(result.current[0]).toEqual(initialSort);
    errorSpy.mockRestore();
  });
});
