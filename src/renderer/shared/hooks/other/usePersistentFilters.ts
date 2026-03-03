import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { Filter } from '../../types/filter';

const LOCAL_STORAGE_KEY = 'pageFilters';

export const usePersistentFilters = (initialFilters: Filter[], componentId: string) => {
  const location = useLocation();
  const pageKey = location.pathname;
  const storageKey = `${pageKey}:${componentId}`;

  const [filters, setFilters] = useState<Filter[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed[storageKey] || initialFilters;
      }
      return initialFilters;
    } catch (err) {
      console.error('Error reading filters from localStorage', err);
      return initialFilters;
    }
  });

  const updateFilters = useCallback(
    (newFilters: Filter[]) => {
      setFilters(newFilters);
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[storageKey] = newFilters;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      } catch (err) {
        console.error('Error saving filters to localStorage', err);
      }
    },
    [storageKey]
  );

  return [filters, updateFilters] as const;
};
