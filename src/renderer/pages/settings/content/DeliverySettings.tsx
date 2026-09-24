import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { getApi, isWebMode } from '../../../shared/api/restApi';
import { PageHeader } from '../../../shared/components/layout/pageHeader/PageHeader';
import { useAppSelector } from '../../../state/configureStore';
import { selectSettings } from '../../../state/pageSlice';

interface DeliverySettingsData {
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
}

type SmtpPasswordStatus = { configured: boolean; source: 'keychain' | 'env' };

interface Props {
  showBack: boolean;
  onBack?: () => void;
  onDeliverySettings?: (data: DeliverySettingsData) => void;
}

export const DeliverySettings: FC<Props> = ({ showBack, onBack = () => {}, onDeliverySettings = () => {} }) => {
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<SmtpPasswordStatus | undefined>();
  const [form, setForm] = useState<DeliverySettingsData>({
    smtpHost: storeSettings?.smtpHost ?? '',
    smtpPort: storeSettings?.smtpPort,
    smtpSecure: storeSettings?.smtpSecure ?? true,
    smtpUser: storeSettings?.smtpUser ?? '',
    smtpFromEmail: storeSettings?.smtpFromEmail ?? '',
    smtpFromName: storeSettings?.smtpFromName ?? ''
  });

  const refreshPasswordStatus = async () => {
    const result = await getApi().getSmtpPasswordStatus();
    setPasswordStatus(result.data);
  };

  useEffect(() => {
    void refreshPasswordStatus();
  }, []);

  const savePassword = async () => {
    if (!smtpPassword) return;
    await getApi().setSmtpPassword(smtpPassword);
    setSmtpPassword('');
    await refreshPasswordStatus();
  };

  const deletePassword = async () => {
    await getApi().deleteSmtpPassword();
    setSmtpPassword('');
    await refreshPasswordStatus();
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
                  passwordStatus?.configured
                    ? t('deliverySettings.smtpPasswordConfiguredKeychain')
                    : t('deliverySettings.smtpPasswordMissingKeychain')
                }
              />
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={savePassword} disabled={!smtpPassword}>
                  {t('common.save')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={deletePassword}
                  disabled={!passwordStatus?.configured}
                >
                  {t('common.remove')}
                </Button>
              </Stack>
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
