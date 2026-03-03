import { Autocomplete, FormControlLabel, Grid, Switch, TextField } from '@mui/material';
import { useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { AmountInput } from '../../shared/components/inputs/amountInput/AmountInput';
import { useCategoriesRetrieve } from '../../shared/hooks/categories/useCategoriesRetrieve';
import { useUnitsRetrieve } from '../../shared/hooks/units/useUnitsRetrieve';
import { useForm } from '../../shared/hooks/useForm';
import { useFormDirtyCheck } from '../../shared/hooks/useFormDirtyCheck';
import type { Category } from '../../shared/types/category';
import type { Item, ItemFromData } from '../../shared/types/item';
import type { Response } from '../../shared/types/response';
import type { Unit } from '../../shared/types/unit';
import { validators } from '../../shared/utils/validatorFunctions';
import { useAppDispatch, useAppSelector } from '../../state/configureStore';
import { addToast, selectCategoriesOptions, selectSettings, selectUnitsOptions } from '../../state/pageSlice';

interface Props {
  item?: Item;
  handleChange?: (data: { item: ItemFromData; isFormValid: boolean; description?: string }) => void;
}
export const Form: FC<Props> = ({ handleChange = () => {}, item }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const initialFormRef = useRef<ItemFromData | undefined>(undefined);

  useUnitsRetrieve({
    onDone: (data: Response<Unit[]>) => {
      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }
    }
  });

  useCategoriesRetrieve({
    onDone: (data: Response<Category[]>) => {
      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }
    }
  });

  const settings = useAppSelector(selectSettings);
  const unitsOptions = useAppSelector(selectUnitsOptions);
  const categoriesOptions = useAppSelector(selectCategoriesOptions);

  const { form, setForm, update } = useForm<ItemFromData>({
    id: item?.id,
    name: item?.name ?? '',
    amount: item?.amount ?? '0',
    unitId: item?.unitId,
    categoryId: item?.categoryId,
    description: item?.description ?? '',
    isArchived: item?.isArchived ?? false
  });

  const [errors, setErrors] = useState({
    name: false,
    amount: false
  });

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && (field === 'name' || field === 'amount')) {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useFormDirtyCheck(form, initialFormRef);

  useEffect(() => {
    const initial = {
      id: item?.id,
      name: item?.name ?? '',
      amount: item?.amount ?? '0',
      unitId: item?.unitId,
      categoryId: item?.categoryId,
      description: item?.description ?? '',
      isArchived: item?.isArchived ?? false
    };
    initialFormRef.current = initial;
    setForm(initial);
  }, [item, setForm]);

  useEffect(() => {
    const valid = form.name.trim() !== '' && form.amount !== undefined && form.amount.trim() !== '';

    handleChange({
      item: form,
      isFormValid: valid,
      description: t('common.invalidForm')
    });
  }, [form, errors, handleChange, t]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
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
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('common.description')}
          fullWidth
          value={form.description}
          onChange={e => {
            update('description', e.target.value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <AmountInput
          required={true}
          label={t('common.amount')}
          value={form.amount !== undefined ? Number(form.amount) : undefined}
          amountFormat={settings?.amountFormat}
          error={errors.amount}
          helperText={errors.amount ? t('common.fieldRequired') : ''}
          onChange={e => {
            const value = e !== undefined ? e.toString() : '';
            update('amount', value);
            validateField('amount', value);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          fullWidth
          options={unitsOptions}
          disableClearable={false}
          value={unitsOptions.find(opt => opt.value === form.unitId) ?? null}
          onChange={(_e, newValue) => {
            update('unitId', newValue?.value);
          }}
          renderInput={params => <TextField {...params} label={t('common.unit')} />}
          freeSolo={false}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          fullWidth
          options={categoriesOptions}
          disableClearable={false}
          value={categoriesOptions.find(opt => opt.value === form.categoryId) ?? null}
          onChange={(_e, newValue) => {
            update('categoryId', newValue?.value);
          }}
          renderInput={params => <TextField {...params} label={t('common.category')} />}
          freeSolo={false}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 12 }}>
        <FormControlLabel
          control={<Switch checked={form.isArchived} onChange={e => update('isArchived', e.target.checked)} />}
          label={t('common.archived')}
        />
      </Grid>
    </Grid>
  );
};
