import { Autocomplete, Box, Grid, TextField } from '@mui/material';
import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../shared/components/layout/pageHeader/PageHeader';
import { AmountFormat, DateFormat, Language } from '@invoice-builder/contracts';
import type { CustomOption } from '../../../shared/types/customOption';
import { useAppSelector } from '../../../state/configureStore';
import {
  AMOUNT_FORMAT_ITEMS,
  AMOUNT_FORMAT_ITEMS_ARRAY,
  DATE_FORMAT_ITEMS,
  DATE_FORMAT_ITEMS_ARRAY,
  LANGUAGE_ITEMS,
  LANGUAGE_ITEMS_ARRAY
} from '../../../state/constant';
import { selectSettings } from '../../../state/pageSlice';

interface Props {
  showBack: boolean;
  onBack?: () => void;
  onLanguageFormat?: (data: { language: Language; amountFormat: AmountFormat; dateFormat: DateFormat }) => void;
}

export const LanguageFormat: FC<Props> = ({ showBack, onLanguageFormat = () => {}, onBack = () => {} }) => {
  const optionsLanguage = LANGUAGE_ITEMS_ARRAY;
  const optionsAmountFormat = AMOUNT_FORMAT_ITEMS_ARRAY;
  const optionsDateFormat = DATE_FORMAT_ITEMS_ARRAY;

  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);
  const [language, setLanguage] = useState<Language>(storeSettings?.language ?? Language.en);
  const [amountFormat, setAmountFormat] = useState<AmountFormat>(storeSettings?.amountFormat ?? AmountFormat.enUS);
  const [dateFormat, setDateFormat] = useState<DateFormat>(storeSettings?.dateFormat ?? DateFormat.MMddyyyy);

  const handleAutocompleteChange =
    <T extends string | number | symbol>(setter: (val: T) => void, key: 'language' | 'amountFormat' | 'dateFormat') =>
    (_event: React.SyntheticEvent, newValue: CustomOption<T> | null) => {
      if (!newValue) return;

      setter(newValue.value);

      onLanguageFormat({
        language: key === 'language' ? LANGUAGE_ITEMS[newValue.value as Language].value : language,
        amountFormat: key === 'amountFormat' ? AMOUNT_FORMAT_ITEMS[newValue.value as AmountFormat].value : amountFormat,
        dateFormat: key === 'dateFormat' ? DATE_FORMAT_ITEMS[newValue.value as DateFormat].value : dateFormat
      });
    };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader title={t('settingsMenuItems.titles.languageFormat')} showBack={showBack} onBack={onBack} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            fullWidth
            options={optionsLanguage}
            getOptionLabel={option => option.label}
            disableClearable={true}
            value={optionsLanguage.find(opt => opt.value === language)}
            onChange={handleAutocompleteChange<Language>(setLanguage, 'language')}
            renderInput={params => <TextField {...params} label={t('languageFormat.language')} required />}
            freeSolo={false}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            fullWidth
            options={optionsAmountFormat}
            getOptionLabel={option => option.label}
            disableClearable={true}
            value={optionsAmountFormat.find(opt => opt.value === amountFormat)}
            onChange={handleAutocompleteChange<AmountFormat>(setAmountFormat, 'amountFormat')}
            renderInput={params => <TextField {...params} label={t('languageFormat.amountFormat')} required />}
            freeSolo={false}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            fullWidth
            options={optionsDateFormat}
            getOptionLabel={option => option.label}
            disableClearable={true}
            value={optionsDateFormat.find(opt => opt.value === dateFormat)}
            onChange={handleAutocompleteChange<DateFormat>(setDateFormat, 'dateFormat')}
            renderInput={params => <TextField {...params} label={t('languageFormat.dateFormat')} required />}
            freeSolo={false}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
