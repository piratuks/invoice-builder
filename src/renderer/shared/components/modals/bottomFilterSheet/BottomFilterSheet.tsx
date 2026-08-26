import { CloseOutlined } from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Autocomplete,
  Box,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  SwipeableDrawer,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useCallback, useMemo, useState, type ChangeEvent, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../../../state/configureStore';
import { selectSettings } from '../../../../state/pageSlice';
import { FilterType } from '../../../enums/filterType';
import type { CustomOption } from '../../../types/customOption';
import type { Filter } from '../../../types/filter';
import { UTCDateRangePicker } from '../../inputs/utcDateRangePicker/UTCDateRangePicker';

interface Props {
  filters: Filter[];
  selectedFilter: Filter[];
  onFilter?: (filter: Filter[]) => void;
}
export const BottomFilterSheet: FC<Props> = ({ filters, onFilter = () => {}, selectedFilter }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const storeSettings = useAppSelector(selectSettings);
  const radioFilters = useMemo(() => filters.filter(f => f.isGroup), [filters]);
  const remainingFilters = useMemo(() => filters.filter(f => !f.isGroup), [filters]);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const getDateRange = (type: FilterType): [string | undefined, string | undefined] => {
    const value = selectedFilter.find(f => f.type === type)?.value;

    if (!value) return [undefined, undefined];

    return value.split(',') as [string, string];
  };

  const updateFilter = useCallback(
    (type: FilterType, value?: string) => {
      let sf = [...selectedFilter];
      const filter = sf.find(f => f.type === type);
      const specificFilter = remainingFilters.find(f => f.type === type);
      let close = false;

      if (filter) {
        if (value) {
          if (type === FilterType.status) {
            if (filter.value !== value) filter.value = value ?? '';
            else sf = sf.filter(item => item.type !== type);
          } else filter.value = value ?? '';
        } else sf = sf.filter(item => item.type !== type);

        if (filter.shouldCloseOnClick) close = true;
      } else if (specificFilter && value) {
        sf.push({ ...specificFilter, value: value ?? '' });

        if (specificFilter.shouldCloseOnClick) close = true;
      }

      onFilter(sf);

      if (close) onClose();
    },
    [onFilter, remainingFilters, selectedFilter]
  );

  const handleChipClick = (type: FilterType, value: string) => updateFilter(type, value);
  const handleDateChange = useCallback((type: FilterType, value?: string) => updateFilter(type, value), [updateFilter]);
  const handleAutocompleteChange =
    <T extends string | number | symbol>(type: FilterType) =>
    (_event: React.SyntheticEvent, newValue: CustomOption<T> | null) =>
      updateFilter(type, newValue?.value as string);

  const onSelectedFilter = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filter = selectedFilter.filter(item => !item.isGroup);
    const specificValue = filters.find(item => item.value === value);
    if (specificValue) {
      filter.push(specificValue);
      onFilter(filter);
      if (specificValue.shouldCloseOnClick) onClose();
    }
  };

  const dropdownValue = useMemo(() => {
    const map = new Map<FilterType, CustomOption<string | number> | undefined>();
    remainingFilters.forEach(item => {
      const filter = selectedFilter.find(f => f.type === item.type);
      const option = filter?.options?.find(o => (o.value as string | number) === filter.value) as
        CustomOption<string | number> | undefined;

      map.set(item.type, option);
    });
    return map;
  }, [selectedFilter, remainingFilters]);

  const renderFilterField = (item: Filter) => {
    switch (item.type) {
      case FilterType.client:
      case FilterType.business:
        return (
          <Autocomplete
            fullWidth
            options={item.options ?? []}
            getOptionLabel={option => option.label}
            disableClearable={false}
            value={dropdownValue.get(item.type) ?? null}
            onChange={handleAutocompleteChange(item.type)}
            renderInput={params => <TextField {...params} label={item.label} />}
            freeSolo={false}
          />
        );
      case FilterType.date:
        const [from, to] = getDateRange(item.type);

        return storeSettings ? (
          <UTCDateRangePicker
            valueFrom={from}
            valueTo={to}
            format={storeSettings.dateFormat}
            onChange={(valueFrom, valueTo) => {
              if (valueFrom && valueTo) handleDateChange(item.type, `${valueFrom},${valueTo}`);
              else handleDateChange(item.type, undefined);
            }}
          />
        ) : null;
      case FilterType.status:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
            {item.options?.map(o => (
              <Chip
                key={o.value as string}
                label={o.label}
                color={dropdownValue.get(item.type)?.value === o.value ? 'secondary' : 'primary'}
                onClick={() => handleChipClick(item.type, o.value as string)}
              />
            ))}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Tooltip title={t('ariaLabel.filters')}>
        <IconButton color="primary" onClick={onOpen} aria-label={t('ariaLabel.filters')}>
          <FilterListIcon />
        </IconButton>
      </Tooltip>

      <SwipeableDrawer
        anchor="bottom"
        open={isOpen}
        onClose={onClose}
        onOpen={onOpen}
        slotProps={{
          paper: {
            sx: {
              maxWidth: isDesktop ? '40%' : '100%',
              mx: 'auto',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              p: 3
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {t('common.selectFilterType')}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title={t('ariaLabel.back')}>
              <IconButton
                onClick={onClose}
                aria-label={t('ariaLabel.back')}
                sx={{
                  color: theme.palette.secondary.main
                }}
              >
                <CloseOutlined fontSize="medium" />
              </IconButton>
            </Tooltip>
          </Box>

          {radioFilters.length > 0 && (
            <RadioGroup
              value={selectedFilter?.find(sf => sf.isGroup)?.value ?? ''}
              onChange={onSelectedFilter}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {radioFilters.map(item => (
                <FormControlLabel
                  key={item.type}
                  value={item.value}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">{item.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          )}
          {remainingFilters.length > 0 && (
            <Grid container spacing={2}>
              {remainingFilters.map(item => (
                <Grid key={item.type} size={{ xs: 12, md: 12 }}>
                  {renderFilterField(item)}
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </SwipeableDrawer>
    </>
  );
};
