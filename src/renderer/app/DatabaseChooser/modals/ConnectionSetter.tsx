import { Button, Dialog, DialogContent, FormControlLabel, Grid, Switch, TextField } from '@mui/material';
import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import { useTestConnectionMutation } from '../../../shared/api/dbSelectorApi';
import { ModalAppBar } from '../../../shared/components/layout/modalAppBar/ModalAppBar';
import { useForm } from '../../../shared/hooks/form/useForm';
import type { PostgresConfig } from '../../../shared/types/postgresConfig';
import { validators } from '../../../shared/utils/validatorFunctions';
import { useAppDispatch } from '../../../state/configureStore';
import { addToast, disableLoadingCursor, enableLoadingCursor } from '../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  onCancel?: () => void;
  onSave?: (config: PostgresConfig) => void;
}
export const ConnectionSetter: FC<Props> = ({ isOpen, onCancel = () => {}, onSave = () => {} }) => {
  const { t } = useTranslation();
  const [isFormValid, setIsFormValid] = useState(true);
  const { form, update } = useForm<PostgresConfig>({
    host: '',
    port: 5432,
    user: '',
    password: '',
    database: '',
    ssl: false
  });
  const [errors, setErrors] = useState({
    host: false,
    port: false,
    user: false,
    database: false
  });
  const dispatch = useAppDispatch();
  const [testConnection, { isLoading: isTestingMutation }] = useTestConnectionMutation();
  const [isTestingRequest, setIsTestingRequest] = useState(false);
  const isTesting = isTestingMutation || isTestingRequest;

  useEffect(() => {
    if (!isTesting) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [dispatch, isTesting]);

  const reportError = (error: unknown) => {
    const { message, key } = (error as { message?: string; key?: string }) ?? {};
    if (message) {
      const resolvedMessage = i18n.exists(message) ? t(message) : message;
      dispatch(addToast({ message: resolvedMessage, severity: 'error' }));
    } else if (key) {
      dispatch(addToast({ message: t(key), severity: 'error' }));
    }
  };

  const validateField = (field: keyof typeof errors, value: string) => {
    if (
      !validators.required(value) &&
      (field === 'host' || field === 'user' || field === 'database' || field === 'port')
    ) {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useEffect(() => {
    const valid =
      form.user.trim() !== '' &&
      !errors.user &&
      form.database.trim() !== '' &&
      !errors.database &&
      form.host.trim() !== '' &&
      !errors.host &&
      form.port.toString().trim() !== '' &&
      !errors.port;

    setIsFormValid(valid);
  }, [form, errors]);

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <ModalAppBar
        title={t('common.addDB')}
        description={t('common.fieldRequired')}
        isFormValid={isFormValid && !isTesting}
        formData={form}
        onClose={onCancel}
        renderCustomButtons={() => {
          return (
            <Button
              variant="outlined"
              disabled={isTesting}
              onClick={() => {
                setIsTestingRequest(true);
                void testConnection(form)
                  .unwrap()
                  .then(() => {
                    dispatch(addToast({ message: t('common.testConnectionSuccess'), severity: 'success' }));
                  })
                  .catch(reportError)
                  .finally(() => setIsTestingRequest(false));
              }}
            >
              {t('common.testConnection')}
            </Button>
          );
        }}
        onSave={data => {
          onSave(data as PostgresConfig);
        }}
      />
      <DialogContent sx={{ minWidth: '300px' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t('common.host')}
              fullWidth
              required
              value={form.host}
              error={errors.host}
              helperText={errors.host ? t('common.fieldRequired') : ''}
              onChange={e => {
                update('host', e.target.value);
                validateField('host', e.target.value);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t('common.database')}
              fullWidth
              required
              value={form.database}
              error={errors.database}
              helperText={errors.database ? t('common.fieldRequired') : ''}
              onChange={e => {
                update('database', e.target.value);
                validateField('database', e.target.value);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t('common.user')}
              fullWidth
              required
              value={form.user}
              error={errors.user}
              helperText={errors.user ? t('common.fieldRequired') : ''}
              onChange={e => {
                update('user', e.target.value);
                validateField('user', e.target.value);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t('common.password')}
              fullWidth
              type="password"
              value={form.password}
              onChange={e => {
                update('password', e.target.value);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t('common.port')}
              fullWidth
              required
              type="number"
              value={form.port}
              onChange={e => {
                update('port', Number(e.target.value));
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.ssl ?? false}
                  onChange={(_e, newValue) => {
                    update('ssl', newValue);
                  }}
                />
              }
              label={t('common.ssl')}
            />
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
