import { useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { SpinnerOverlay } from '../shared/components/feedback/spinner/SpinnerOverlay';
import { ToastContainer } from '../shared/components/feedback/toast/toastContainer';
import { Confirmation } from '../shared/components/modals/confirmation';
import { BeforeUnloadProvider } from '../shared/context/BeforeUnloadContext';
import { useSettingsRetrieve } from '../shared/hooks/settings/useSettingsRetrieve';
import { useBeforeLeave } from '../shared/hooks/useBeforeLeave';
import type { Response } from '../shared/types/response';
import type { Settings } from '../shared/types/settings';
import { useAppDispatch, useAppSelector } from '../state/configureStore';
import { addToast, removeToast, selectAllowed, selectIsLoading, selectToasts, setSettings } from '../state/pageSlice';
import { AppLayout } from './AppLayout';
import { DatabaseChooser } from './DatabaseChooser/DatabaseChooser';

export const App: FC = () => {
  const [dbReady, setDbReady] = useState<boolean>(false);
  const isLoading = useAppSelector(selectIsLoading);
  const toasts = useAppSelector(selectToasts);
  const isAllowedToLeave = useAppSelector(selectAllowed);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { showPrompt, cancelNavigation, confirmNavigation, attemptNavigation, setBlocked } =
    useBeforeLeave(isAllowedToLeave);

  const { settings, execute: getSettings } = useSettingsRetrieve({
    immediate: false,
    onDone: (data: Response<Settings>) => {
      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }
    }
  });

  const handleClose = useCallback(
    (id: string) => {
      dispatch(removeToast(id));
    },
    [dispatch]
  );

  const onDatabaseRead = useCallback(() => {
    setDbReady(true);
    getSettings();
  }, [getSettings]);

  const handleConfirmLeave = useCallback(() => {
    confirmNavigation();
  }, [confirmNavigation]);

  const handleCancelLeave = useCallback(() => {
    cancelNavigation();
  }, [cancelNavigation]);

  useEffect(() => {
    if (settings) {
      dispatch(setSettings(settings));
      i18n.changeLanguage(settings.language);
      localStorage.setItem('lastUsedLanguage', settings.language);
    }
  }, [settings, dispatch]);

  return (
    <>
      {!dbReady && <DatabaseChooser onDatabaseRead={onDatabaseRead} />}
      {dbReady && (
        <BeforeUnloadProvider value={{ attemptNavigation, setBlocked }}>
          <AppLayout />
        </BeforeUnloadProvider>
      )}
      <ToastContainer toasts={toasts} onClose={handleClose} />
      {isLoading && <SpinnerOverlay />}
      <Confirmation
        isOpen={showPrompt}
        text={t('common.beforeLeave')}
        onCancel={handleCancelLeave}
        onConfirm={handleConfirmLeave}
      />
    </>
  );
};
