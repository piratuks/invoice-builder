import { Dialog, DialogContent, TextField, Typography } from '@mui/material';
import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { PDFText } from '@invoice-builder/contracts';
import { ModalAppBar } from '../../modalAppBar/ModalAppBar';

interface Props {
  isOpen: boolean;
  currLabelMeta: { key: keyof PDFText; label: string; value?: string } | undefined;
  onCancel?: () => void;
  onSave?: (label?: string) => void;
}
export const LabelModal: FC<Props> = ({ isOpen, currLabelMeta, onCancel = () => {}, onSave = () => {} }) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState<string>(currLabelMeta?.value ?? '');

  useEffect(() => {
    setLabel(currLabelMeta?.value ?? '');
  }, [currLabelMeta]);

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <ModalAppBar
        title={t('common.setLabel')}
        description={t('common.fieldRequired')}
        isFormValid={true}
        formData={label}
        onClose={onCancel}
        onSave={data => {
          if (data === '') onSave(undefined);
          else onSave(data as string);
        }}
      />
      <DialogContent sx={{ minWidth: '300px' }}>
        <Typography
          component="div"
          variant="body2"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 2 }}
        >
          {currLabelMeta?.label}
        </Typography>
        <TextField
          label={t('common.label')}
          value={label}
          onChange={e => {
            setLabel(e.target.value);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
