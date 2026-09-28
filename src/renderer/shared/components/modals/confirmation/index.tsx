import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
  text: string;
  secondaryText?: string;
}
export const Confirmation: FC<Props> = ({ isOpen, text, secondaryText, onCancel = () => {}, onConfirm = () => {} }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onCancel} aria-labelledby="import-confirm-title">
      <DialogTitle id="import-confirm-title">{t('common.confirmation')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{text}</DialogContentText>
        {secondaryText && <DialogContentText>{secondaryText}</DialogContentText>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm} autoFocus>
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
