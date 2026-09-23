import { useCallback, useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useGetSettingsQuery } from '../shared/api/settingsApi';
import { SpinnerOverlay } from '../shared/components/feedback/spinner/SpinnerOverlay';
import { ToastContainer } from '../shared/components/feedback/toast/toastContainer';
import { Confirmation } from '../shared/components/modals/confirmation';
import { BeforeUnloadProvider } from '../shared/context/BeforeUnloadContext';
import { useBeforeLeave } from '../shared/hooks/other/useBeforeLeave';
import { useAppDispatch, useAppSelector } from '../state/configureStore';
import {
  addToast,
  disableLoadingCursor,
  enableLoadingCursor,
  removeToast,
  selectAllowed,
  selectDbReady,
  selectIsLoading,
  selectToasts,
  setDbReady,
  setSettings
} from '../state/pageSlice';
import { AppLayout } from './AppLayout';
import { DatabaseChooser } from './DatabaseChooser/DatabaseChooser';

export const App: FC = () => {
  const dbReady = useAppSelector(selectDbReady);
  const isLoading = useAppSelector(selectIsLoading);
  const toasts = useAppSelector(selectToasts);
  const isAllowedToLeave = useAppSelector(selectAllowed);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { showPrompt, cancelNavigation, confirmNavigation, attemptNavigation, setBlocked } =
    useBeforeLeave(isAllowedToLeave);

  const {
    data: settings,
    isError: isSettingsError,
    error: settingsError,
    isLoading: isSettingsLoading,
    isFetching: isSettingsFetching
  } = useGetSettingsQuery(undefined, { skip: !dbReady });

  const handleClose = useCallback(
    (id: string) => {
      dispatch(removeToast(id));
    },
    [dispatch]
  );

  const onDatabaseRead = useCallback(() => {
    dispatch(setDbReady(true));
  }, [dispatch]);

  const handleConfirmLeave = useCallback(() => {
    confirmNavigation();
  }, [confirmNavigation]);

  const handleCancelLeave = useCallback(() => {
    cancelNavigation();
  }, [cancelNavigation]);

  useEffect(() => {
    if (isSettingsError) {
      const message = settingsError && 'message' in settingsError ? settingsError.message : undefined;
      const key = settingsError && 'key' in settingsError ? settingsError.key : undefined;
      if (message) {
        dispatch(addToast({ message: i18n.exists(message) ? t(message) : message, severity: 'error' }));
      } else if (key) {
        dispatch(addToast({ message: t(key), severity: 'error' }));
      }
    }
  }, [dispatch, isSettingsError, settingsError, t]);

  useEffect(() => {
    if (settings) {
      dispatch(setSettings(settings));
      i18n.changeLanguage(settings.language);
      localStorage.setItem('lastUsedLanguage', settings.language);
    }
  }, [settings, dispatch]);

  useEffect(() => {
    if (!isSettingsLoading && !isSettingsFetching) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [dispatch, isSettingsFetching, isSettingsLoading]);

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
