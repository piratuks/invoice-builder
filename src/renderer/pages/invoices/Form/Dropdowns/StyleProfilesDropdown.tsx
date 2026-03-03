import { SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../../../shared/enums/filterType';
import { useStyleProfilesRetrieve } from '../../../../shared/hooks/styleProfiles/useStyleProfilesRetrieve';
import type { Filter, FilterData } from '../../../../shared/types/filter';
import type { Response } from '../../../../shared/types/response';
import type { StyleProfile, StyleProfileAdd, StyleProfileUpdate } from '../../../../shared/types/styleProfiles';
import { createCommonFilters, createInvoiceFilters } from '../../../../shared/utils/filterSortFunctions';
import { List as StyleProfileList } from '../../../styleProfiles/List';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: StyleProfile) => void;
}

const StyleProfilesDropdownComponent: FC<Props> = ({ isOpen, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'styleProfiles', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'styleProfiles' })
  ];
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const useStyleProfilesCRUDRetrieve = (args: {
    filter?: FilterData[];
    onDone?: (data: Response<StyleProfile[]>) => void;
  }) => {
    const { styleProfiles, execute } = useStyleProfilesRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: styleProfiles, execute };
  };
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
              height: '80%',
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
        <CRUDPage<StyleProfile, StyleProfileAdd, StyleProfileUpdate>
          componentId="invoices:styleprofiles"
          filters={filters}
          showRightSide={false}
          showAddButton={false}
          useRetrieve={useStyleProfilesCRUDRetrieve}
          searchField={'name'}
          sortOptions={[
            { label: t('common.name'), value: 'name' },
            { label: t('common.lastUpdate'), value: 'updatedAt' }
          ]}
          noItemText={t('styleProfiles.noItem')}
          renderListItem={(item, selectedItem) => (
            <StyleProfileList
              key={item.id}
              item={item}
              showDeleteButton={false}
              selectedItem={selectedItem}
              onEdit={(editItem: StyleProfile) => onClick?.(editItem)}
            />
          )}
        />
      </SwipeableDrawer>
    </>
  );
};
export const StyleProfilesDropdown = memo(StyleProfilesDropdownComponent);
