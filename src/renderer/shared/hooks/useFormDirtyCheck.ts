import { useEffect, useState, type RefObject } from 'react';
import { useAppDispatch } from '../../state/configureStore';
import { setAllowed } from '../../state/pageSlice';

export const useFormDirtyCheck = <T>(form: T | undefined, initialFormRef: RefObject<T | undefined>) => {
  const dispatch = useAppDispatch();
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!form) {
      setIsDirty(false);
      dispatch(setAllowed(true));
      return;
    }

    try {
      const a = JSON.stringify(initialFormRef.current ?? {});
      const b = JSON.stringify(form ?? {});
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
