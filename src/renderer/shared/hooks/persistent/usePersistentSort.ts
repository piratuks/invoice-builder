import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SortType } from '../../enums/sortType';
import type { CustomOption } from '../../types/customOption';

const LOCAL_STORAGE_KEY = 'pageSort';

export const usePersistentSort = <T extends string | number | symbol>(
  initialSort: { activeSort: SortType; activeSortBy: CustomOption<T> },
  componentId: string
) => {
  const location = useLocation();
  const pageKey = location.pathname;
  const storageKey = `${pageKey}:${componentId}`;

  const [sort, setSort] = useState<{ activeSort: SortType; activeSortBy: CustomOption<T> }>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed[storageKey] || initialSort;
      }
      return initialSort;
    } catch (err) {
      console.error('Error reading sort from localStorage', err);
      return initialSort;
    }
  });

  const updateSort = useCallback(
    (newSort: { activeSort: SortType; activeSortBy: CustomOption<T> }) => {
      setSort(newSort);
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[storageKey] = newSort;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      } catch (err) {
        console.error('Error saving sort to localStorage', err);
      }
    },
    [storageKey]
  );

  return [sort, updateSort] as const;
};
