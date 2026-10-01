import { Dialog, DialogContent, TextField } from '@mui/material';
import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalAppBar } from '../../../shared/components/layout/modalAppBar/ModalAppBar';
import { validators } from '../../../shared/utils/validatorFunctions';

interface Props {
  isOpen: boolean;
  onCancel?: () => void;
  onSave?: (name: string) => void;
}
export const PasswordSetter: FC<Props> = ({ isOpen, onCancel = () => {}, onSave = () => {} }) => {
  const { t } = useTranslation();
  const [isFormValid, setIsFormValid] = useState(true);
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordErrors] = useState(false);

  useEffect(() => {
    const valid = password.trim() !== '' && !passwordError;

    setIsFormValid(valid);
  }, [password, passwordError]);

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <ModalAppBar
        title={t('common.setPassword')}
        description={t('common.fieldRequired')}
        isFormValid={isFormValid}
        formData={password}
        onClose={onCancel}
        onSave={data => {
          onSave(data as string);
        }}
      />
      <DialogContent sx={{ minWidth: '300px' }}>
        <TextField
          required={true}
          label={t('common.password')}
          type="password"
          value={password}
          error={passwordError}
          helperText={passwordError ? t('common.fieldRequired') : ''}
          onChange={e => {
            setPassword(e.target.value);
            if (!validators.required((e ?? '').toString())) {
              setPasswordErrors(true);
            } else {
              setPasswordErrors(false);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
