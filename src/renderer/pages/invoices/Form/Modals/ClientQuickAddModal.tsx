import { Dialog, DialogContent, Grid, TextField } from '@mui/material';
import { memo, useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../i18n';
import { ModalAppBar } from '../../../../shared/components/layout/modalAppBar/ModalAppBar';
import { useForm } from '../../../../shared/hooks/form/useForm';
import { useClientAdd } from '../../../../shared/hooks/clients/useClientAdd';
import type { Client, ClientAdd } from '../../../../shared/types/client';
import type { Response } from '../../../../shared/types/response';
import { generateClientShortName } from '../../../../shared/utils/clientFunctions';
import { validators } from '../../../../shared/utils/validatorFunctions';
import { useAppDispatch } from '../../../../state/configureStore';
import { addToast } from '../../../../state/pageSlice';

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

  const { execute: addClient } = useClientAdd({
    client: clientToAdd,
    immediate: false,
    onDone: (data: Response<Client>) => {
      setClientToAdd(undefined);
      if (data.success && data.data) {
        onCreated(data.data);
        return;
      }
      if (data.message) {
        const message = i18n.exists(data.message) ? t(data.message) : data.message;
        dispatch(addToast({ message, severity: 'error' }));
      } else if (data.key) {
        dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }
    }
  });

  const validateField = useCallback((field: keyof typeof errors, value: string) => {
    if (field === 'name') {
      setErrors(e => ({ ...e, name: !validators.required(value) }));
    } else if (field === 'phone') {
      setErrors(e => ({ ...e, phone: value !== '' && !validators.phone(value) }));
    }
  }, []);

  const isFormValid = validators.required(form.name.trim()) && (form.phone === '' || validators.phone(form.phone));

  useEffect(() => {
    if (clientToAdd) addClient();
  }, [clientToAdd, addClient]);

  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', phone: '' });
      setErrors({ name: false, phone: false });
      setClientToAdd(undefined);
    }
  }, [isOpen, setForm]);

  const handleSave = useCallback(() => {
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
  }, [form.name, form.phone]);

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <ModalAppBar
        title={t('invoices.addBillTo')}
        description={t('common.fieldRequired')}
        isFormValid={isFormValid}
        formData={form}
        onClose={onCancel}
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
