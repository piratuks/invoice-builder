import { useCallback, useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useAppDispatch } from '../../state/configureStore';
import { setAllowed } from '../../state/pageSlice';

interface UseBeforeUnloadResult {
  blocked: boolean;
  showPrompt: boolean;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  setBlocked: (v: boolean) => void;
}

export const useBeforeUnload = (allowedToLeave = true): UseBeforeUnloadResult => {
  const dispatch = useAppDispatch();
  const [blocked, setBlocked] = useState<boolean>(!allowedToLeave);
  const blocker = useBlocker(blocked);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    setBlocked(!allowedToLeave);
    dispatch(setAllowed(allowedToLeave));
  }, [allowedToLeave, dispatch]);

  useEffect(() => {
    setShowPrompt(blocker.state === 'blocked');
  }, [blocker.state]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!blocked) return;
      e.preventDefault();
      //e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [blocked]);

  const confirmNavigation = useCallback(() => {
    blocker.proceed?.();
    setShowPrompt(false);
    setBlocked(false);
    dispatch(setAllowed(true));
  }, [blocker, dispatch, setBlocked]);

  const cancelNavigation = useCallback(() => {
    blocker.reset?.();
    setShowPrompt(false);
    dispatch(setAllowed(false));
  }, [blocker, dispatch]);

  return {
    blocked,
    showPrompt,
    confirmNavigation,
    cancelNavigation,
    setBlocked
  };
};
