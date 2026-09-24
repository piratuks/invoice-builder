import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import { isWebMode } from '../../../shared/api/restApi';
import {
  useDeleteSmtpPasswordMutation,
  useGetSmtpPasswordStatusQuery,
  useSetSmtpPasswordMutation,
  useTestSmtpDeliveryMutation
} from '../../../shared/api/settingsApi';
import { PageHeader } from '../../../shared/components/layout/pageHeader/PageHeader';
import { DeliveryProvider } from '../../../shared/enums/deliveryProvider';
import { useAppDispatch, useAppSelector } from '../../../state/configureStore';
import { addToast, disableLoadingCursor, enableLoadingCursor, selectSettings } from '../../../state/pageSlice';

interface DeliverySettingsData {
  deliveryProvider: DeliveryProvider;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
}

interface Props {
  showBack: boolean;
  onBack?: () => void;
  onDeliverySettings?: (data: DeliverySettingsData) => void;
}

export const DeliverySettings: FC<Props> = ({ showBack, onBack = () => {}, onDeliverySettings = () => {} }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const storeSettings = useAppSelector(selectSettings);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [testResult, setTestResult] = useState<{ severity: 'success' | 'error'; message: string } | undefined>();
  const {
    data: passwordStatus,
    isFetching: isPasswordStatusFetching,
    error: passwordStatusError
  } = useGetSmtpPasswordStatusQuery();
  const [setSmtpPasswordMutation, { isLoading: isSavingPassword }] = useSetSmtpPasswordMutation();
  const [deleteSmtpPasswordMutation, { isLoading: isDeletingPassword }] = useDeleteSmtpPasswordMutation();
  const [testSmtpDelivery, { isLoading: isTestingDelivery }] = useTestSmtpDeliveryMutation();
  const [form, setForm] = useState<DeliverySettingsData>({
    deliveryProvider: storeSettings?.deliveryProvider ?? DeliveryProvider.smtp,
    smtpHost: storeSettings?.smtpHost ?? '',
    smtpPort: storeSettings?.smtpPort,
    smtpSecure: storeSettings?.smtpSecure ?? true,
    smtpUser: storeSettings?.smtpUser ?? '',
    smtpFromEmail: storeSettings?.smtpFromEmail ?? '',
    smtpFromName: storeSettings?.smtpFromName ?? ''
  });

  const getApiErrorMessage = useCallback(
    (error: unknown) => {
      if (error && typeof error === 'object') {
        const message = 'message' in error ? error.message : undefined;
        const key = 'key' in error ? error.key : undefined;
        if (typeof message === 'string') return i18n.exists(message) ? t(message) : message;
        if (typeof key === 'string') return t(key);
      }
      return t('error.unknownError');
    },
    [t]
  );

  useEffect(() => {
    if (!passwordStatusError) return;
    dispatch(addToast({ message: getApiErrorMessage(passwordStatusError), severity: 'error' }));
  }, [dispatch, getApiErrorMessage, passwordStatusError]);

  const isBusy = isPasswordStatusFetching || isSavingPassword || isDeletingPassword || isTestingDelivery;
  useEffect(() => {
    if (!isBusy) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [dispatch, isBusy]);

  const savePassword = async () => {
    if (!smtpPassword) return;
    try {
      await setSmtpPasswordMutation(smtpPassword).unwrap();
      setSmtpPassword('');
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), severity: 'error' }));
    }
  };

  const deletePassword = async () => {
    try {
      await deleteSmtpPasswordMutation().unwrap();
      setSmtpPassword('');
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), severity: 'error' }));
    }
  };

  const sendTestEmail = async () => {
    const result = await testSmtpDelivery({ recipient: testRecipient });
    const error = 'error' in result ? result.error : undefined;
    const message = error && 'message' in error ? error.message : undefined;
    const key = error && 'key' in error ? error.key : undefined;
    setTestResult({
      severity: 'data' in result ? 'success' : 'error',
      message: 'data' in result ? t('deliverySettings.smtpTestSent') : message || t(key ?? 'error.unknownError')
    });
  };

  const update = <K extends keyof DeliverySettingsData>(key: K, value: DeliverySettingsData[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onDeliverySettings(next);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader title={t('settingsMenuItems.titles.deliverySettings')} showBack={showBack} onBack={onBack} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <InputLabel>{t('deliverySettings.provider')}</InputLabel>
          <Select
            fullWidth
            label={t('deliverySettings.provider')}
            value={form.deliveryProvider}
            onChange={event => update('deliveryProvider', event.target.value as DeliveryProvider)}
          >
            <MenuItem value={DeliveryProvider.smtp}>{t('deliverySettings.providerSmtp')}</MenuItem>
          </Select>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2">{t('deliverySettings.smtpSettings')}</Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            label={t('deliverySettings.smtpHost')}
            value={form.smtpHost ?? ''}
            onChange={event => update('smtpHost', event.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label={t('deliverySettings.smtpPort')}
            value={form.smtpPort ?? ''}
            slotProps={{ htmlInput: { min: 1 } }}
            onChange={event => update('smtpPort', event.target.value ? Number(event.target.value) : undefined)}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch checked={form.smtpSecure} onChange={event => update('smtpSecure', event.target.checked)} />
            }
            label={t('deliverySettings.smtpSecure')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label={t('deliverySettings.smtpUser')}
            value={form.smtpUser ?? ''}
            onChange={event => update('smtpUser', event.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label={t('deliverySettings.smtpFromEmail')}
            value={form.smtpFromEmail ?? ''}
            onChange={event => update('smtpFromEmail', event.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label={t('deliverySettings.smtpFromName')}
            value={form.smtpFromName ?? ''}
            onChange={event => update('smtpFromName', event.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2">{t('deliverySettings.smtpPasswordSection')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isWebMode() ? t('deliverySettings.smtpPasswordWebHelp') : t('deliverySettings.smtpPasswordElectronHelp')}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {isWebMode() ? (
            <Alert severity={passwordStatus?.configured ? 'success' : 'warning'}>
              {passwordStatus?.configured
                ? t('deliverySettings.smtpPasswordConfiguredEnv')
                : isPasswordStatusFetching
                  ? t('common.checking')
                  : t('deliverySettings.smtpPasswordMissingEnv')}
            </Alert>
          ) : (
            <Stack spacing={1}>
              <TextField
                fullWidth
                type="password"
                label={t('deliverySettings.smtpPassword')}
                value={smtpPassword}
                onChange={event => setSmtpPassword(event.target.value)}
                helperText={
                  isPasswordStatusFetching
                    ? t('common.checking')
                    : passwordStatus?.configured
                      ? t('deliverySettings.smtpPasswordConfiguredKeychain')
                      : t('deliverySettings.smtpPasswordMissingKeychain')
                }
              />
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={savePassword} disabled={!smtpPassword || isSavingPassword}>
                  {isSavingPassword ? t('common.saving') : t('common.save')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={deletePassword}
                  disabled={!passwordStatus?.configured || isDeletingPassword}
                >
                  {isDeletingPassword ? t('common.removing') : t('common.remove')}
                </Button>
              </Stack>
            </Stack>
          )}
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2">{t('deliverySettings.smtpTestSection')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('deliverySettings.smtpTestHelp')}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={1}>
            <TextField
              fullWidth
              label={t('deliverySettings.smtpTestRecipient')}
              value={testRecipient}
              onChange={event => setTestRecipient(event.target.value)}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={sendTestEmail} disabled={!testRecipient || isTestingDelivery}>
                {isTestingDelivery ? t('common.sending') : t('deliverySettings.smtpTestSend')}
              </Button>
            </Stack>
          </Stack>
        </Grid>
        {testResult && (
          <Grid size={{ xs: 12 }}>
            <Alert severity={testResult.severity}>{testResult.message}</Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
