import { SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../../../shared/enums/filterType';
import { useBanksRetrieve } from '../../../../shared/hooks/banks/useBanksRetrieve';
import type { Bank, BankAdd, BankUpdate } from '../../../../shared/types/bank';
import type { Filter, FilterData } from '../../../../shared/types/filter';
import type { Response } from '../../../../shared/types/response';
import { createCommonFilters, createInvoiceFilters } from '../../../../shared/utils/filterSortFunctions';
import { List as BankList } from '../../../banks/List';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: Bank) => void;
}

const BanksDropdownComponent: FC<Props> = ({ isOpen, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'banks', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'banks' })
  ];
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const useBanksCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Bank[]>) => void }) => {
    const { banks, execute } = useBanksRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: banks, execute };
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
        <CRUDPage<Bank, BankAdd, BankUpdate>
          componentId="invoices:banks"
          filters={filters}
          showRightSide={false}
          showAddButton={false}
          useRetrieve={useBanksCRUDRetrieve}
          searchField={'name'}
          sortOptions={[
            { label: t('common.name'), value: 'name' },
            { label: t('common.lastUpdate'), value: 'updatedAt' }
          ]}
          noItemText={t('banks.noItem')}
          renderListItem={(item, selectedItem) => (
            <BankList
              key={item.id}
              item={item}
              showDeleteButton={false}
              selectedItem={selectedItem}
              onEdit={(editItem: Bank) => onClick?.(editItem)}
            />
          )}
        />
      </SwipeableDrawer>
    </>
  );
};
export const BanksDropdown = memo(BanksDropdownComponent);
