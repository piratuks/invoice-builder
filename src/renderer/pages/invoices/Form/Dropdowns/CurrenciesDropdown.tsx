import { SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../../../shared/enums/filterType';
import { useCurrenciesRetrieve } from '../../../../shared/hooks/currencies/useCurrenciesRetrieve';
import type { Currency, CurrencyAdd, CurrencyUpdate } from '../../../../shared/types/currency';
import type { Filter, FilterData } from '../../../../shared/types/filter';
import type { Response } from '../../../../shared/types/response';
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
  const useCurrenciesCRUDRetrieve = (args: {
    filter?: FilterData[];
    onDone?: (data: Response<Currency[]>) => void;
  }) => {
    const { currencies, execute } = useCurrenciesRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: currencies, execute };
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
        <CRUDPage<Currency, CurrencyAdd, CurrencyUpdate>
          componentId="invoices:currencies"
          filters={filters}
          showRightSide={false}
          showAddButton={false}
          useRetrieve={useCurrenciesCRUDRetrieve}
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
