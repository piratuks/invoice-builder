import {
  Box,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { memo, useCallback, useMemo, type FC } from 'react';
import { SearchInput } from '../../../../shared/components/inputs/searchInput/SearchInput';
import type { Language } from '../../../../shared/enums/language';
import { usePersistentSearch } from '../../../../shared/hooks/persistent/usePersistentSearch';
import { filterAndSortArray } from '../../../../shared/utils/filterSortFunctions';
import { LANGUAGE_ITEMS_ARRAY } from '../../../../state/constant';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: Language) => void;
}
const LanguageDropdownComponent: FC<Props> = ({ isOpen, onClose, onOpen, onClick }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const optionsLanguage = LANGUAGE_ITEMS_ARRAY;
  const [persistentSearch, setPersistentSearch] = usePersistentSearch('', 'invoices:languages');

  const onSearchChanged = useCallback(
    (value: string) => {
      setPersistentSearch(value);
    },
    [setPersistentSearch]
  );

  const filteredItems = useMemo(() => {
    return filterAndSortArray({
      data: optionsLanguage,
      searchValue: persistentSearch,
      searchField: 'label'
    });
  }, [optionsLanguage, persistentSearch]);

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
          <SearchInput value={persistentSearch} onChange={onSearchChanged} />

          {filteredItems.map(option => (
            <Paper
              elevation={2}
              key={option.value}
              sx={{
                borderRadius: 1,
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                transition: 'all 0.2s ease-in-out',
                minWidth: '250px'
              }}
            >
              <ListItemButton
                onClick={() => onClick?.(option.value)}
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
                  <ListItemText
                    primary={
                      <Typography
                        component="div"
                        variant="body1"
                        sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {option.label}
                      </Typography>
                    }
                    disableTypography
                    sx={{ m: 0 }}
                    slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                  />
                </ListItem>
              </ListItemButton>
            </Paper>
          ))}
        </Box>
      </SwipeableDrawer>
    </>
  );
};
export const LanguageDropdown = memo(LanguageDropdownComponent);
