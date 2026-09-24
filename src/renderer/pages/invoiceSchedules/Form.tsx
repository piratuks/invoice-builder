import HistoryIcon from '@mui/icons-material/History';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  Alert,
  Autocomplete,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useUpdateInvoiceScheduleMutation } from '../../shared/api/invoiceSchedulesApi';
import { useGetInvoicesQuery } from '../../shared/api/invoicesApi';
import { useGetSmtpPasswordStatusQuery } from '../../shared/api/settingsApi';
import { Datepicker } from '../../shared/components/inputs/datepicker/Datepicker';
import { DateFormat } from '../../shared/enums/dateFormat';
import { FilterType } from '../../shared/enums/filterType';
import {
  InvoiceScheduleCadence,
  InvoiceScheduleDeliveryMethod,
  InvoiceScheduleStatus
} from '../../shared/enums/invoiceSchedule';
import { InvoiceType } from '../../shared/enums/invoiceType';
import { useForm } from '../../shared/hooks/form/useForm';
import { useFormDirtyCheck } from '../../shared/hooks/form/useFormDirtyCheck';
import type { InvoiceSchedule, InvoiceScheduleForm } from '../../shared/types/invoiceSchedule';
import { getInvoiceLabel } from '../../shared/utils/invoiceScheduleFunctions';
import { validators } from '../../shared/utils/validatorFunctions';
import { useAppDispatch, useAppSelector } from '../../state/configureStore';
import { addToast, disableLoadingCursor, enableLoadingCursor, selectSettings } from '../../state/pageSlice';
import { ScheduleRunHistoryDialog } from './ScheduleRunHistoryDialog';

interface Props {
  item?: InvoiceSchedule;
  handleChange?: (data: { schedule: InvoiceScheduleForm; isFormValid: boolean; description?: string }) => void;
}

export const Form: FC<Props> = ({ item, handleChange = () => {} }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const [
    updateSchedule,
    { error: updateScheduleError, isError: isUpdateScheduleError, isLoading: isUpdatingSchedule }
  ] = useUpdateInvoiceScheduleMutation();
  const [historySchedule, setHistorySchedule] = useState<InvoiceSchedule | undefined>();
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const timezones = useMemo(() => {
    const intlWithTimezones = Intl as typeof Intl & {
      supportedValuesOf?: (key: 'timeZone') => string[];
    };
    const supported = intlWithTimezones.supportedValuesOf?.('timeZone') ?? [];
    return Array.from(new Set(['UTC', timezone, ...supported])).sort();
  }, [timezone]);
  const initialFormRef = useRef<InvoiceScheduleForm | undefined>(undefined);
  const { data: invoices = [] } = useGetInvoicesQuery({
    invoiceType: InvoiceType.invoice,
    filter: [{ type: FilterType.active }]
  });
  const {
    data: smtpPasswordStatus,
    error: smtpPasswordStatusError,
    isError: isSmtpPasswordStatusError
  } = useGetSmtpPasswordStatusQuery();
  const isEmailDeliveryConfigured = Boolean(
    settings?.smtpHost && settings.smtpPort && settings.smtpFromEmail && smtpPasswordStatus?.configured
  );
  const getInitialForm = useCallback((): InvoiceScheduleForm => {
    return {
      id: item?.id,
      sourceInvoiceId: item?.sourceInvoiceId,
      cadence: item?.cadence ?? InvoiceScheduleCadence.monthly,
      intervalCount: item?.intervalCount ?? 1,
      timezone: item?.timezone ?? timezone,
      startAt: item?.startAt,
      endAt: item?.endAt,
      maxOccurrences: item?.maxOccurrences,
      nextRunAt: item?.nextRunAt,
      lastRunAt: item?.lastRunAt,
      dueDateOffsetDays: item?.dueDateOffsetDays ?? 0,
      status: item?.status ?? InvoiceScheduleStatus.active,
      isArchived: item?.isArchived ?? false,
      deliveryMethod: item?.deliveryMethod ?? InvoiceScheduleDeliveryMethod.none,
      failureReason: item?.failureReason
    };
  }, [item, timezone]);

  const { form, setForm, update } = useForm<InvoiceScheduleForm>(getInitialForm());
  const [errors, setErrors] = useState({
    sourceInvoiceId: false,
    intervalCount: false,
    startAt: false,
    timezone: false
  });

  const validateField = (field: keyof typeof errors, value: string | number | undefined) => {
    const isRequired = (nextValue: string | number | undefined) => {
      if (typeof nextValue === 'number') return nextValue > 0;
      return validators.required(String(nextValue ?? ''));
    };

    if (field === 'sourceInvoiceId') {
      setErrors(e => ({ ...e, sourceInvoiceId: !isRequired(value) }));
      return;
    }

    if (field === 'intervalCount') {
      setErrors(e => ({ ...e, intervalCount: !isRequired(value) }));
      return;
    }

    if (field === 'startAt') {
      setErrors(e => ({ ...e, startAt: !validators.required(String(value ?? '')) }));
      return;
    }

    if (field === 'timezone') {
      setErrors(e => ({ ...e, timezone: !validators.required(String(value ?? '')) }));
    }
  };

  useFormDirtyCheck(form, initialFormRef);

  useEffect(() => {
    if (!isUpdateScheduleError) return;
    const { message, key } = (updateScheduleError as { message?: string; key?: string }) ?? {};
    if (message) {
      dispatch(addToast({ message: i18n.exists(message) ? t(message) : message, severity: 'error' }));
    } else if (key) {
      dispatch(addToast({ message: t(key), severity: 'error' }));
    }
  }, [dispatch, isUpdateScheduleError, t, updateScheduleError]);

  useEffect(() => {
    if (!isSmtpPasswordStatusError) return;
    const { message, key } = (smtpPasswordStatusError as { message?: string; key?: string }) ?? {};
    if (message) {
      dispatch(addToast({ message: i18n.exists(message) ? t(message) : message, severity: 'error' }));
    } else if (key) {
      dispatch(addToast({ message: t(key), severity: 'error' }));
    }
  }, [dispatch, isSmtpPasswordStatusError, smtpPasswordStatusError, t]);

  useEffect(() => {
    if (!isUpdatingSchedule) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [dispatch, isUpdatingSchedule]);

  useEffect(() => {
    const initial = getInitialForm();
    initialFormRef.current = initial;
    setForm(initial);
  }, [getInitialForm, setForm]);

  const isValid =
    form.sourceInvoiceId != null &&
    form.sourceInvoiceId > 0 &&
    form.intervalCount != null &&
    form.intervalCount > 0 &&
    Boolean(form.startAt) &&
    Boolean(form.timezone);

  useEffect(() => {
    handleChange({
      schedule: form,
      isFormValid: isValid,
      description: t('common.invalidForm')
    });
  }, [form, handleChange, isValid, t]);

  const setScheduleStatus = async (status: InvoiceScheduleStatus) => {
    if (!item?.id) return;
    const id = item.id;
    await updateSchedule({ ...item, id, status }).unwrap();
    initialFormRef.current = { ...form, status };
    update('status', status);
  };

  return (
    <>
      <Grid container spacing={2}>
        {item?.id && (
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HistoryIcon />}
                onClick={() => setHistorySchedule(item)}
              >
                {t('invoiceSchedules.history')}
              </Button>
              {form.status === InvoiceScheduleStatus.active ? (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PauseIcon />}
                  disabled={isUpdatingSchedule}
                  onClick={() => setScheduleStatus(InvoiceScheduleStatus.paused)}
                >
                  {t('invoiceSchedules.pause')}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlayArrowIcon />}
                  disabled={form.status === InvoiceScheduleStatus.completed || form.isArchived || isUpdatingSchedule}
                  onClick={() => setScheduleStatus(InvoiceScheduleStatus.active)}
                >
                  {t('invoiceSchedules.resume')}
                </Button>
              )}
            </Stack>
          </Grid>
        )}
        {invoices.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="info">{t('invoiceSchedules.noInvoices')}</Alert>
          </Grid>
        )}
        <Grid size={{ xs: 12 }}>
          <Autocomplete
            fullWidth
            options={invoices}
            value={invoices.find(invoice => invoice.id === form.sourceInvoiceId) ?? null}
            getOptionLabel={getInvoiceLabel}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_event, invoice) => {
              const nextValue = invoice?.id ?? 0;
              update('sourceInvoiceId', nextValue);
              validateField('sourceInvoiceId', nextValue);
            }}
            renderInput={params => (
              <TextField
                {...params}
                label={t('invoiceSchedules.sourceInvoice')}
                required
                error={errors.sourceInvoiceId}
                helperText={errors.sourceInvoiceId ? t('common.fieldRequired') : ''}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>{t('invoiceSchedules.cadence')}</InputLabel>
            <Select
              label={t('invoiceSchedules.cadence')}
              value={form.cadence ?? InvoiceScheduleCadence.monthly}
              onChange={event => update('cadence', event.target.value as InvoiceScheduleCadence)}
            >
              <MenuItem value={InvoiceScheduleCadence.weekly}>{t('invoiceSchedules.weekly')}</MenuItem>
              <MenuItem value={InvoiceScheduleCadence.monthly}>{t('invoiceSchedules.monthly')}</MenuItem>
              <MenuItem value={InvoiceScheduleCadence.quarterly}>{t('invoiceSchedules.quarterly')}</MenuItem>
              <MenuItem value={InvoiceScheduleCadence.yearly}>{t('invoiceSchedules.yearly')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            required
            type="number"
            label={t('invoiceSchedules.intervalCount')}
            value={form.intervalCount ?? 1}
            slotProps={{ htmlInput: { min: 1 } }}
            error={errors.intervalCount}
            helperText={errors.intervalCount ? t('common.fieldRequired') : ''}
            onChange={event => {
              const nextValue = Math.max(1, Number(event.target.value));
              update('intervalCount', nextValue);
              validateField('intervalCount', nextValue);
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label={t('invoiceSchedules.dueDateOffsetDays')}
            value={form.dueDateOffsetDays ?? 0}
            slotProps={{ htmlInput: { min: 0 } }}
            onChange={event => update('dueDateOffsetDays', Math.max(0, Number(event.target.value)))}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Datepicker
            label={t('invoiceSchedules.startAt')}
            required
            value={form.startAt}
            format={settings?.dateFormat ?? DateFormat.MMddyyyy}
            error={errors.startAt}
            onChange={value => {
              update('startAt', value ?? '');
              validateField('startAt', value ?? '');
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Datepicker
            label={t('invoiceSchedules.endAt')}
            value={form.endAt}
            format={settings?.dateFormat ?? DateFormat.MMddyyyy}
            onChange={value => update('endAt', value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="number"
            label={t('invoiceSchedules.maxOccurrences')}
            value={form.maxOccurrences ?? ''}
            slotProps={{ htmlInput: { min: 1 } }}
            onChange={event =>
              update('maxOccurrences', event.target.value ? Math.max(1, Number(event.target.value)) : undefined)
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            fullWidth
            options={timezones}
            value={form.timezone ?? timezone}
            onChange={(_event, zone) => {
              const nextValue = zone ?? timezone;
              update('timezone', nextValue);
              validateField('timezone', nextValue);
            }}
            renderInput={params => (
              <TextField
                {...params}
                label={t('invoiceSchedules.timezone')}
                required
                error={errors.timezone}
                helperText={errors.timezone ? t('common.fieldRequired') : ''}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth>
            <InputLabel>{t('invoiceSchedules.deliveryMethod')}</InputLabel>
            <Select
              label={t('invoiceSchedules.deliveryMethod')}
              value={form.deliveryMethod ?? InvoiceScheduleDeliveryMethod.none}
              onChange={event => update('deliveryMethod', event.target.value as InvoiceScheduleDeliveryMethod)}
            >
              <MenuItem value={InvoiceScheduleDeliveryMethod.none}>{t('invoiceSchedules.deliveryNone')}</MenuItem>
              <MenuItem value={InvoiceScheduleDeliveryMethod.email} disabled={!isEmailDeliveryConfigured}>
                {isEmailDeliveryConfigured
                  ? t('invoiceSchedules.deliveryValue.email')
                  : t('invoiceSchedules.deliveryEmailSoon')}
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.isArchived ?? false}
                onChange={event => {
                  const isArchived = event.target.checked;
                  update('isArchived', isArchived);
                  if (isArchived) update('status', InvoiceScheduleStatus.paused);
                }}
              />
            }
            label={t('common.archived')}
          />
        </Grid>
      </Grid>
      <ScheduleRunHistoryDialog schedule={historySchedule} onClose={() => setHistorySchedule(undefined)} />
    </>
  );
};
