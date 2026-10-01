import { Dialog, DialogContent, Grid } from '@mui/material';
import { memo, useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Datepicker } from '../../../shared/components/inputs/datepicker/Datepicker';
import { ModalAppBar } from '../../../shared/components/layout/modalAppBar/ModalAppBar';
import { useForm } from '../../../shared/hooks/form/useForm';
import { useAppSelector } from '../../../state/configureStore';
import { selectSettings } from '../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  fromDate: string;
  to: string;
  onCancel?: () => void;
  onSave?: (data: { from: string; to: string }) => void;
}
const RangeSetterComponent: FC<Props> = ({ isOpen, fromDate, to, onCancel = () => {}, onSave = () => {} }) => {
  const { t } = useTranslation();
  const { form, setForm, update } = useForm<{ from: string; to: string }>({
    from: fromDate,
    to: to
  });
  const storeSettings = useAppSelector(selectSettings);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      from: fromDate
    }));
  }, [fromDate, setForm]);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      to: to
    }));
  }, [to, setForm]);

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <ModalAppBar
        title={t('reports.selectDateRange')}
        isFormValid={true}
        formData={form}
        onClose={onCancel}
        onSave={data => {
          onSave(data as { from: string; to: string });
        }}
      />
      <DialogContent sx={{ minWidth: '300px' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            {storeSettings && (
              <Datepicker
                required={true}
                label={`${t('common.from')}`}
                value={form.from}
                format={storeSettings.dateFormat}
                onChange={value => {
                  update('from', value ?? '');
                }}
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            {storeSettings && (
              <Datepicker
                required={true}
                label={`${t('common.to')}`}
                value={form.to}
                format={storeSettings.dateFormat}
                onChange={value => {
                  update('to', value ?? '');
                }}
              />
            )}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
export const RangeSetter = memo(RangeSetterComponent);
