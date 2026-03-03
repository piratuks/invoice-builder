import { FormControlLabel, Grid, Switch, TextField } from '@mui/material';
import { useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '../../shared/hooks/useForm';
import { useFormDirtyCheck } from '../../shared/hooks/useFormDirtyCheck';
import type { Category, CategoryFromData } from '../../shared/types/category';
import { validators } from '../../shared/utils/validatorFunctions';

interface Props {
  category?: Category;
  handleChange?: (data: { category: CategoryFromData; isFormValid: boolean; description?: string }) => void;
}
export const Form: FC<Props> = ({ handleChange = () => {}, category }) => {
  const { t } = useTranslation();
  const initialFormRef = useRef<CategoryFromData | undefined>(undefined);
  const { form, setForm, update } = useForm<CategoryFromData>({
    id: category?.id,
    name: category?.name ?? '',
    isArchived: category?.isArchived ?? false
  });
  const [errors, setErrors] = useState({
    name: false
  });

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && field === 'name') {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  useFormDirtyCheck(form, initialFormRef);

  useEffect(() => {
    const initial = {
      id: category?.id,
      name: category?.name ?? '',
      isArchived: category?.isArchived ?? false
    };
    initialFormRef.current = initial;
    setForm(initial);
  }, [category, setForm]);

  useEffect(() => {
    const valid = form.name.trim() !== '' && !errors.name;

    handleChange({
      category: form,
      isFormValid: valid,
      description: t('common.invalidForm')
    });
  }, [form, errors, handleChange, t]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 12 }}>
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
      <Grid size={{ xs: 12, md: 12 }}>
        <FormControlLabel
          control={<Switch checked={form.isArchived} onChange={e => update('isArchived', e.target.checked)} />}
          label={t('common.archived')}
        />
      </Grid>
    </Grid>
  );
};
