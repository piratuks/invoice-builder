import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import {
  Box,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { memo, useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import { SearchInput } from '../../../shared/components/inputs/searchInput/SearchInput';
import { PageHeader } from '../../../shared/components/layout/pageHeader/PageHeader';
import { usePresetsRetrieve } from '../../../shared/hooks/presets/usePresetsRetrieve';
import type { Preset } from '../../../shared/types/preset';
import type { Response } from '../../../shared/types/response';
import { filterAndSortArray } from '../../../shared/utils/filterSortFunctions';
import { useAppDispatch } from '../../../state/configureStore';
import { addToast } from '../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onNewFromPreset?: (data: Preset) => void;
}
const NewActionDropdownComponent: FC<Props> = ({ isOpen, onClose, onOpen, onNew, onNewFromPreset }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [searchValue, setSearchValue] = useState('');

  const onSearchChanged = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const dispatch = useAppDispatch();
  const { presets } = usePresetsRetrieve({
    onDone: (data: Response<Preset[]>) => {
      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }
    }
  });

  const filteredPresets = useMemo(() => {
    return filterAndSortArray({
      data: presets,
      searchValue,
      searchField: 'name'
    });
  }, [presets, searchValue]);

  return (
    <>
      <SwipeableDrawer
        anchor="bottom"
        open={isOpen}
        onClose={() => onClose?.()}
        onOpen={() => onOpen?.()}
        slotProps={{
          paper: {
            sx: {
              maxWidth: isDesktop ? '40%' : '100%',
              height: '40%',
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
        <Box sx={{ mb: 2, mt: 2, display: 'flex', gap: 2, flexDirection: 'column' }}>
          <PageHeader
            title={t('ariaLabel.moreActions')}
            showBack={false}
            showSave={false}
            showClose={true}
            onClose={onClose}
          />
          <Box>
            <SearchInput value={searchValue} onChange={onSearchChanged} />
            <ListItemButton
              onClick={() => onNew?.()}
              sx={{
                width: '100%',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'start',
                alignItems: 'start',
                flexDirection: 'column',
                marginTop: 2
              }}
            >
              <ListItem sx={{ p: 0 }}>
                <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                  <AddCircleOutline />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      component="div"
                      variant="body1"
                      sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {t('common.createNew')}
                    </Typography>
                  }
                  disableTypography
                  sx={{ m: 0 }}
                  slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                />
              </ListItem>
            </ListItemButton>
            {filteredPresets.map(preset => {
              return (
                <ListItemButton
                  key={`preset-${preset.id}`}
                  onClick={() => onNewFromPreset?.(preset)}
                  sx={{
                    width: '100%',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'start',
                    alignItems: 'start',
                    flexDirection: 'column'
                  }}
                >
                  <ListItem sx={{ p: 0 }}>
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                      <LibraryAddIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          component="div"
                          variant="body1"
                          sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {t('common.createNewFromPreset', { name: preset.name })}
                        </Typography>
                      }
                      disableTypography
                      sx={{ m: 0 }}
                      slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                    />
                  </ListItem>
                </ListItemButton>
              );
            })}
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
};
export const NewActionDropdown = memo(NewActionDropdownComponent);
