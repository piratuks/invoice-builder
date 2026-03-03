import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useAppDispatch } from '../../state/configureStore';
import { setAllowed } from '../../state/pageSlice';

interface UseBeforeLeaveResult {
  blocked: boolean;
  showPrompt: boolean;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  setBlocked: (v: boolean) => void;
  attemptNavigation: (action: () => void) => void;
}

export const useBeforeLeave = (allowedToLeave = true): UseBeforeLeaveResult => {
  const dispatch = useAppDispatch();
  const [blocked, setBlocked] = useState<boolean>(!allowedToLeave);
  const blocker = useBlocker(blocked);
  const [showPrompt, setShowPrompt] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

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

    try {
      pendingAction.current?.();
    } finally {
      pendingAction.current = null;
    }
  }, [blocker, dispatch, setBlocked]);

  const cancelNavigation = useCallback(() => {
    blocker.reset?.();
    setShowPrompt(false);
    dispatch(setAllowed(false));

    pendingAction.current = null;
  }, [blocker, dispatch]);

  const attemptNavigation = useCallback(
    (action: () => void) => {
      if (!blocked) {
        action();
        return;
      }

      pendingAction.current = action;
      setShowPrompt(true);
    },
    [blocked]
  );

  return {
    blocked,
    showPrompt,
    confirmNavigation,
    cancelNavigation,
    setBlocked,
    attemptNavigation
  };
};
