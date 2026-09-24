import { Grid, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useExportAllDataMutation, useImportAllDataMutation } from '../../shared/api/backupApi';
import { useUpdateSettingsMutation } from '../../shared/api/settingsApi';
import { Content } from '../../shared/components/layout/content/Content';
import { NoItem } from '../../shared/components/lists/noItem/NoItem';
import { Confirmation } from '../../shared/components/modals/confirmation';
import type { AmountFormat } from '../../shared/enums/amountFormat';
import type { DateFormat } from '../../shared/enums/dateFormat';
import type { Language } from '../../shared/enums/language';
import { MenuItemSettings } from '../../shared/enums/menuItemSettings';
import { useAppDispatch, useAppSelector } from '../../state/configureStore';
import {
  addToast,
  disableLoadingCursor,
  enableLoadingCursor,
  selectSettings,
  setCustomInvoiseSettings,
  setEInvoiceUBL,
  setEInvoiceXRechnung,
  setInvoiceSchedules,
  setLanguageDate,
  setMode,
  setPresets,
  setQuotes,
  setReceiptPrintingOn,
  setReports,
  setSmtpSettings,
  setStyleProfiles
} from '../../state/pageSlice';
import { CustomizeInvoice } from './content/CustomizeInvoice';
import { DeliverySettings } from './content/DeliverySettings';
import { LanguageFormat } from './content/LanguageFormat';
import { Menu } from './menu/Menu';

export const SettingsPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItemSettings | undefined>(undefined);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const dispatch = useAppDispatch();
  const storeSettings = useAppSelector(selectSettings);
  const hasInitialized = useRef(false);
  const stableSettings = useMemo(() => storeSettings ?? {}, [storeSettings]);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [updateSettings, { isLoading: isUpdatingSettings }] = useUpdateSettingsMutation();
  const [exportAllData, { isLoading: isExporting }] = useExportAllDataMutation();
  const [importAllData, { isLoading: isImporting }] = useImportAllDataMutation();

  const reportBackupError = useCallback(
    (error: unknown) => {
      const { message, key } = (error as { message?: string; key?: string }) ?? {};
      if (message) {
        dispatch(addToast({ message: i18n.exists(message) ? t(message) : message, severity: 'error' }));
      } else if (key) {
        dispatch(addToast({ message: t(key), severity: 'error' }));
      }
    },
    [dispatch, t]
  );

  const onModeChange = useCallback(
    (isDark: boolean) => {
      dispatch(setMode(isDark));
    },
    [dispatch]
  );

  const toggleQuotes = useCallback(
    (value: boolean) => {
      dispatch(setQuotes(value));
    },
    [dispatch]
  );

  const toggleInvoiceSchedules = useCallback(
    (value: boolean) => {
      dispatch(setInvoiceSchedules(value));
    },
    [dispatch]
  );

  const toggleStyleProfiles = useCallback(
    (value: boolean) => {
      dispatch(setStyleProfiles(value));
    },
    [dispatch]
  );

  const toggleReceiptPrinting = useCallback(
    (value: boolean) => {
      dispatch(setReceiptPrintingOn(value));
    },
    [dispatch]
  );

  const togglePresets = useCallback(
    (value: boolean) => {
      dispatch(setPresets(value));
    },
    [dispatch]
  );

  const toggleUBL = useCallback(
    (value: boolean) => {
      dispatch(setEInvoiceUBL(value));
    },
    [dispatch]
  );

  const toggleXRechnung = useCallback(
    (value: boolean) => {
      dispatch(setEInvoiceXRechnung(value));
    },
    [dispatch]
  );

  const toggleReports = useCallback(
    (value: boolean) => {
      dispatch(setReports(value));
    },
    [dispatch]
  );

  const exportJSON = useCallback(() => {
    void exportAllData()
      .unwrap()
      .then(result => {
        const path = result?.filePath;
        dispatch(
          addToast({
            message: path ? t('common.exportedTo', { path }) : t('common.exported'),
            severity: 'success'
          })
        );
      })
      .catch(reportBackupError);
  }, [dispatch, exportAllData, reportBackupError, t]);

  const importJSONCallback = useCallback(() => {
    setShowImportConfirm(true);
  }, []);

  const handleCancelImport = useCallback(() => {
    setShowImportConfirm(false);
  }, []);

  const handleConfirmImport = useCallback(() => {
    handleCancelImport();
    void importAllData()
      .unwrap()
      .then(() => dispatch(addToast({ message: t('common.imported'), severity: 'success' })))
      .catch(reportBackupError);
  }, [dispatch, handleCancelImport, importAllData, reportBackupError, t]);

  const onCustomizedInvoice = useCallback(
    (data: {
      suffix?: string;
      prefix?: string;
      includeMonth: boolean;
      includeYear: boolean;
      includeBusinessName: boolean;
    }) => {
      dispatch(
        setCustomInvoiseSettings({
          invoicePrefix: data.prefix,
          invoiceSuffix: data.suffix,
          shouldIncludeMonth: data.includeMonth,
          shouldIncludeYear: data.includeYear,
          shouldIncludeBusinessName: data.includeBusinessName
        })
      );
    },
    [dispatch]
  );

  const onLanguageFormat = useCallback(
    (data: { language: Language; amountFormat: AmountFormat; dateFormat: DateFormat }) => {
      i18n.changeLanguage(data.language);
      localStorage.setItem('lastUsedLanguage', data.language);

      dispatch(
        setLanguageDate({
          language: data.language,
          amountFormat: data.amountFormat,
          dateFormat: data.dateFormat
        })
      );
    },
    [dispatch]
  );

  const onDeliverySettings = useCallback(
    (data: {
      smtpHost?: string;
      smtpPort?: number;
      smtpSecure: boolean;
      smtpUser?: string;
      smtpFromEmail?: string;
      smtpFromName?: string;
    }) => {
      dispatch(setSmtpSettings(data));
    },
    [dispatch]
  );

  useEffect(() => {
    if (!isUpdatingSettings) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [dispatch, isUpdatingSettings]);

  useEffect(() => {
    if (!isExporting && !isImporting) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [dispatch, isExporting, isImporting]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    void updateSettings(stableSettings)
      .unwrap()
      .catch(error => {
        if (error?.message) {
          const message = i18n.exists(error.message) ? t(error.message) : error.message;
          dispatch(addToast({ message, severity: 'error' }));
        } else if (error?.key) {
          dispatch(addToast({ message: t(error.key), severity: 'error' }));
        }
      });
  }, [dispatch, stableSettings, t, updateSettings]);

  const onSelected = useCallback((item: MenuItemSettings | undefined) => {
    setCurrentMenuItem(item);
  }, []);

  const onBack = useCallback(() => {
    setCurrentMenuItem(undefined);
  }, []);

  let rightColumn: ReactNode;
  if (typeof currentMenuItem === 'undefined') {
    rightColumn = <NoItem text={t('app.noItems')} />;
  } else {
    switch (currentMenuItem) {
      case MenuItemSettings.Receipt:
        rightColumn = (
          <CustomizeInvoice onCustomizedInvoice={onCustomizedInvoice} showBack={!isDesktop} onBack={onBack} />
        );
        break;
      case MenuItemSettings.LanguageFormat:
        rightColumn = <LanguageFormat onLanguageFormat={onLanguageFormat} showBack={!isDesktop} onBack={onBack} />;
        break;
      case MenuItemSettings.Delivery:
        rightColumn = (
          <DeliverySettings onDeliverySettings={onDeliverySettings} showBack={!isDesktop} onBack={onBack} />
        );
        break;
      default:
        rightColumn = <NoItem text={t('app.noItems')} />;
        break;
    }
  }

  const leftColumnMenu = (
    <Menu
      onSelected={onSelected}
      selectedMenu={currentMenuItem}
      onModeChange={onModeChange}
      toggleQuotes={toggleQuotes}
      toggleInvoiceSchedules={toggleInvoiceSchedules}
      toggleReports={toggleReports}
      toggleReceiptPrinting={toggleReceiptPrinting}
      toggleStyleProfiles={toggleStyleProfiles}
      togglePresets={togglePresets}
      toggleUBL={toggleUBL}
      toggleXRechnung={toggleXRechnung}
      onDeliverySettings={() => onSelected(MenuItemSettings.Delivery)}
      onExportJSON={exportJSON}
      onImportJSON={importJSONCallback}
    />
  );

  return (
    <Grid
      container
      component="div"
      spacing={2}
      sx={{ height: '100%', justifyContent: 'center', alignItems: 'stretch' }}
    >
      <Confirmation
        onCancel={handleCancelImport}
        onConfirm={handleConfirmImport}
        isOpen={showImportConfirm}
        text={t('settingsMenuItems.importConfirmText')}
      />
      {isDesktop ? (
        <>
          {leftColumnMenu}
          <Content node={rightColumn} />
        </>
      ) : (
        <>{typeof currentMenuItem === 'undefined' ? leftColumnMenu : <Content node={rightColumn} />}</>
      )}
    </Grid>
  );
};
