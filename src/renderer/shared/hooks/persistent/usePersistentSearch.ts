import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

const LOCAL_STORAGE_KEY = 'pageSearch';

export const usePersistentSearch = (initialSearch: string, componentId: string) => {
  const location = useLocation();
  const pageKey = location.pathname;
  const storageKey = `${pageKey}:${componentId}`;

  const [search, setSearch] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed[storageKey] || initialSearch;
      }
      return initialSearch;
    } catch (err) {
      console.error('Error reading search from localStorage', err);
      return initialSearch;
    }
  });

  const updateSearch = useCallback(
    (newSearch: string) => {
      setSearch(newSearch);
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[storageKey] = newSearch;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      } catch (err) {
        console.error('Error saving search to localStorage', err);
      }
    },
    [storageKey]
  );

  return [search, updateSearch] as const;
};
