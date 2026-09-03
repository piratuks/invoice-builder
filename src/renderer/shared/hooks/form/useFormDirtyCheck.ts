import { useEffect, useState, type RefObject } from 'react';
import { useAppDispatch } from '../../../state/configureStore';
import { setAllowed } from '../../../state/pageSlice';

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

export const useFormDirtyCheck = <T>(form: T | undefined, initialFormRef: RefObject<T | undefined>) => {
  const dispatch = useAppDispatch();
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!form || !initialFormRef.current) {
      setIsDirty(false);
      dispatch(setAllowed(true));
      return;
    }

    try {
      const a = stableStringify(initialFormRef.current ?? {});
      const b = stableStringify(form ?? {});
      const dirty = a !== b;
      setIsDirty(dirty);
      dispatch(setAllowed(!dirty));
    } catch {
      setIsDirty(false);
      dispatch(setAllowed(true));
    }
  }, [dispatch, form, initialFormRef]);

  return isDirty;
};
