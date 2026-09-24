import { Dialog, DialogContent, Grid, TextField } from '@mui/material';
import { memo, useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../i18n';
import { useAddClientMutation } from '../../../../shared/api/clientsApi';
import { ModalAppBar } from '../../../../shared/components/layout/modalAppBar/ModalAppBar';
import { useForm } from '../../../../shared/hooks/form/useForm';
import type { Client, ClientAdd } from '../../../../shared/types/client';
import { generateClientShortName } from '../../../../shared/utils/clientFunctions';
import { validators } from '../../../../shared/utils/validatorFunctions';
import { useAppDispatch } from '../../../../state/configureStore';
import { addToast, disableLoadingCursor, enableLoadingCursor } from '../../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  onCancel?: () => void;
  onCreated?: (client: Client) => void;
}

const ClientQuickAddModalComponent: FC<Props> = ({ isOpen, onCancel = () => {}, onCreated = () => {} }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { form, setForm, update } = useForm({ name: '', phone: '' });
  const [errors, setErrors] = useState({ name: false, phone: false });
  const [clientToAdd, setClientToAdd] = useState<ClientAdd | undefined>(undefined);

  const [addClient, { isLoading: loading, isError, error }] = useAddClientMutation();

  useEffect(() => {
    if (!clientToAdd) return;

    void addClient(clientToAdd)
      .unwrap()
      .then(client => {
        setClientToAdd(undefined);
        onCreated(client);
      })
      .catch(() => {
        setClientToAdd(undefined);
      });
  }, [addClient, clientToAdd, onCreated]);

  useEffect(() => {
    if (!isError) return;
    const { message, key } = (error as { message?: string; key?: string }) ?? {};
    if (message) {
      dispatch(addToast({ message: i18n.exists(message) ? t(message) : message, severity: 'error' }));
    } else if (key) {
      dispatch(addToast({ message: t(key), severity: 'error' }));
    }
  }, [isError, error, dispatch, t]);

  useEffect(() => {
    if (!loading) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [loading, dispatch]);

  const validateField = useCallback((field: keyof typeof errors, value: string) => {
    if (field === 'name') {
      setErrors(e => ({ ...e, name: !validators.required(value) }));
    } else if (field === 'phone') {
      setErrors(e => ({ ...e, phone: value !== '' && !validators.phone(value) }));
    }
  }, []);

  const isFormValid = validators.required(form.name.trim()) && (form.phone === '' || validators.phone(form.phone));

  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', phone: '' });
      setErrors({ name: false, phone: false });
      setClientToAdd(undefined);
    }
  }, [isOpen, setForm]);

  const handleCancel = useCallback(() => {
    if (loading) return;
    onCancel();
  }, [loading, onCancel]);

  const handleSave = useCallback(() => {
    if (loading || clientToAdd) return;

    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();

    if (!validators.required(trimmedName)) {
      setErrors(e => ({ ...e, name: true }));
      return;
    }
    if (trimmedPhone !== '' && !validators.phone(trimmedPhone)) {
      setErrors(e => ({ ...e, phone: true }));
      return;
    }

    setClientToAdd({
      name: trimmedName,
      phone: trimmedPhone || undefined,
      shortName: generateClientShortName(trimmedName),
      isArchived: false
    });
  }, [clientToAdd, form.name, form.phone, loading]);

  const isSaving = loading || clientToAdd !== undefined;

  return (
    <Dialog open={isOpen} onClose={handleCancel}>
      <ModalAppBar
        title={t('invoices.addBillTo')}
        description={t('common.fieldRequired')}
        isFormValid={isFormValid}
        isSaving={isSaving}
        formData={form}
        onClose={handleCancel}
        onSave={handleSave}
      />
      <DialogContent sx={{ minWidth: '300px' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label={t('common.name')}
              fullWidth
              required
              value={form.name}
              error={errors.name}
              helperText={errors.name ? t('common.fieldRequired') : ''}
              onChange={e => {
                update('name', e.target.value);
                validateField('name', e.target.value);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label={t('common.phone')}
              fullWidth
              value={form.phone}
              error={errors.phone}
              helperText={errors.phone ? t('common.invalidPhone') : ''}
              onChange={e => {
                update('phone', e.target.value);
                validateField('phone', e.target.value);
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export const ClientQuickAddModal = memo(ClientQuickAddModalComponent);
