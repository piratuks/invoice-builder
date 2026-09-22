import { SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetCurrenciesQuery } from '../../../../shared/api/currenciesApi';
import { CRUDPageRTK } from '../../../../shared/components/layout/crudPage/CRUDPageRTK';
import { FilterType } from '../../../../shared/enums/filterType';
import type { Currency, CurrencyAdd, CurrencyUpdate } from '../../../../shared/types/currency';
import type { Filter } from '../../../../shared/types/filter';
import { createCommonFilters, createInvoiceFilters } from '../../../../shared/utils/filterSortFunctions';
import { List as CurrenciesList } from '../../../currencies/List';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: Currency) => void;
}

const CurrenciesDropdownComponent: FC<Props> = ({ isOpen, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'currencies', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'currencies' })
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
        <CRUDPageRTK<Currency, CurrencyAdd, CurrencyUpdate>
          componentId="invoices:currencies"
          filters={filters}
          showRightSide={false}
          showAddButton={false}
          useRetrieve={useGetCurrenciesQuery}
          searchField={'text'}
          sortOptions={[
            { label: t('common.text'), value: 'text' },
            { label: t('common.lastUpdate'), value: 'updatedAt' }
          ]}
          noItemText={t('currencies.noItem')}
          renderListItem={(item, selectedItem) => (
            <CurrenciesList
              key={item.id}
              item={item}
              showDeleteButton={false}
              selectedItem={selectedItem}
              onEdit={(editItem: Currency) => onClick?.(editItem)}
            />
          )}
        />
      </SwipeableDrawer>
    </>
  );
};
export const CurrenciesDropdown = memo(CurrenciesDropdownComponent);
