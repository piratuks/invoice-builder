import {
  Autocomplete,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField
} from '@mui/material';
import { useEffect, useRef, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FONT_ITEMS_ARRAY } from '../../../../../state/constant';
import { FontFamily } from '../../../../enums/fontFamily';
import { PageFormat } from '../../../../enums/pageFormat';
import { SizeType } from '../../../../enums/sizeType';
import { useForm } from '../../../../hooks/form/useForm';
import { useLayoutsRetrieve } from '../../../../hooks/layouts/useLayoutsRetrieve';
import type { CustomizationFormPageSetup } from '../../../../types/invoice';
import type { Layout } from '../../../../types/layouts';
import { TabPanel } from '../../tabPanel/TabPanel';

interface Props {
  value: number;
  onChange?: (data: CustomizationFormPageSetup) => void;
  data?: CustomizationFormPageSetup;
}
export const PageSetupTab: FC<Props> = ({ data, value, onChange }) => {
  const optionsFont = FONT_ITEMS_ARRAY;
  const { t } = useTranslation();
  const { layouts } = useLayoutsRetrieve({});
  const { form, setForm, update } = useForm<CustomizationFormPageSetup>(data ?? {});
  const lastEmittedRef = useRef<CustomizationFormPageSetup | undefined>(data);

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data, setForm]);

  useEffect(() => {
    if (!form) return;
    let isChanged = false;
    try {
      const prevForm = lastEmittedRef.current;
      isChanged = JSON.stringify(prevForm) !== JSON.stringify(form);
    } catch {
      isChanged = true;
    }
    if (!isChanged) return;

    lastEmittedRef.current = form;
    onChange?.(form);
  }, [form, onChange]);

  return (
    <TabPanel value={value} index={0}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">{t('common.pageFormat')}</FormLabel>
            <RadioGroup
              row
              value={form.pageFormat ?? ''}
              onChange={(_e, newValue) => {
                update('pageFormat', newValue as PageFormat);
              }}
            >
              <FormControlLabel value={PageFormat.a4} control={<Radio />} label="A4" />
              <FormControlLabel value={PageFormat.letter} control={<Radio />} label={t('common.letter')} />
            </RadioGroup>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete<Layout, false, true>
            fullWidth
            disableClearable
            options={layouts.filter(layout => !layout.isArchived)}
            getOptionLabel={layout => layout.schema.meta.name}
            getOptionKey={layout => layout.id}
            value={(layouts.find(layout => layout.id === form.layoutId) ?? null) as Layout}
            onChange={(_event, layout) => {
              update('layoutId', layout?.id);
              update('layoutSchema', layout?.schema);
            }}
            renderInput={params => <TextField {...params} label={t('common.layout')} />}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">{t('common.fontSizeStyle')}</FormLabel>
            <RadioGroup
              row
              value={form.fontSize ?? ''}
              onChange={(_e, newValue) => {
                update('fontSize', newValue as SizeType);
              }}
            >
              <FormControlLabel value={SizeType.small} control={<Radio />} label={t('common.small')} />
              <FormControlLabel value={SizeType.medium} control={<Radio />} label={t('common.medium')} />
              <FormControlLabel value={SizeType.large} control={<Radio />} label={t('common.large')} />
            </RadioGroup>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            fullWidth
            options={optionsFont}
            getOptionLabel={option => option.label}
            disableClearable={true}
            value={optionsFont.find(opt => opt.value === (form.fontFamily ?? FontFamily.roboto))}
            onChange={(_e, newValue) => {
              if (!newValue) return;
              update('fontFamily', newValue.value as FontFamily);
            }}
            renderInput={params => <TextField {...params} label={t('common.fontFamilyStyle')} />}
            freeSolo={false}
          />
        </Grid>
      </Grid>
    </TabPanel>
  );
};
