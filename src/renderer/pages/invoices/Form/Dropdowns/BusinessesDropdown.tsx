import { SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetBusinessesQuery } from '../../../../shared/api/businessesApi';
import { CRUDPageRTK } from '../../../../shared/components/layout/crudPage/CRUDPageRTK';
import { FilterType } from '../../../../shared/enums/filterType';
import type { Business, BusinessAdd, BusinessUpdate } from '../../../../shared/types/business';
import type { Filter } from '../../../../shared/types/filter';
import { createCommonFilters, createInvoiceFilters } from '../../../../shared/utils/filterSortFunctions';
import { List as BusinessList } from '../../../businesses/List';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: Business) => void;
}

const BusinessesDropdownComponent: FC<Props> = ({ isOpen, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'businesses', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'businesses' })
  ];
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
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
        <CRUDPageRTK<Business, BusinessAdd, BusinessUpdate>
          componentId="invoices:businesses"
          filters={filters}
          showRightSide={false}
          showAddButton={false}
          useRetrieve={useGetBusinessesQuery}
          searchField={'name'}
          sortOptions={[
            { label: t('common.name'), value: 'name' },
            { label: t('common.lastUpdate'), value: 'updatedAt' }
          ]}
          noItemText={t('businesses.noItem')}
          renderListItem={(item, selectedItem) => (
            <BusinessList
              key={item.id}
              item={item}
              showDeleteButton={false}
              selectedItem={selectedItem}
              onEdit={(editItem: Business) => onClick?.(editItem)}
            />
          )}
        />
      </SwipeableDrawer>
    </>
  );
};
export const BusinessesDropdown = memo(BusinessesDropdownComponent);
