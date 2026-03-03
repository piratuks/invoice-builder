import { SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { memo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../../../shared/enums/filterType';
import type { InvoiceType } from '../../../../shared/enums/invoiceType';
import { useItemsRetrieve } from '../../../../shared/hooks/items/useItemsRetrieve';
import type { Filter, FilterData } from '../../../../shared/types/filter';
import type { CustomFieldMeta, ItemForm } from '../../../../shared/types/invoice';
import type { Item, ItemAdd, ItemUpdate } from '../../../../shared/types/item';
import type { Response } from '../../../../shared/types/response';
import { createCommonFilters, createInvoiceFilters } from '../../../../shared/utils/filterSortFunctions';
import { List as ItemsList } from '../../../items/List';
import { ItemMetadataSetter } from '../Modals/ItemMetadataSetter';

interface Props {
  isOpen: boolean;
  type: InvoiceType;
  headerOptions: CustomFieldMeta[];
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (item: Item, data: ItemForm) => void;
}

const ItemsDropdownComponent: FC<Props> = ({ isOpen, type, headerOptions, onClose, onOpen, onClick }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const { t } = useTranslation();
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'items', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'items' })
  ];
  const useItemsCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Item[]>) => void }) => {
    const { items, execute } = useItemsRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: items, execute };
  };
  const [selectedItem, setSelectedItem] = useState<Item | undefined>(undefined);

  return (
    <>
      {isOpen && (
        <ItemMetadataSetter
          type={type}
          headerOptions={headerOptions}
          isOpen={selectedItem !== undefined}
          onCancel={() => setSelectedItem(undefined)}
          onSave={data => {
            if (selectedItem) onClick?.(selectedItem, data);
            setSelectedItem(undefined);
          }}
        />
      )}

      {!selectedItem && (
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
          <CRUDPage<Item, ItemAdd, ItemUpdate>
            componentId="invoices:items"
            filters={filters}
            showRightSide={false}
            showAddButton={false}
            useRetrieve={useItemsCRUDRetrieve}
            searchField={'name'}
            sortOptions={[
              { label: t('common.name'), value: 'name' },
              { label: t('common.lastUpdate'), value: 'updatedAt' }
            ]}
            noItemText={t('items.noItem')}
            renderListItem={(item, selectedItem) => (
              <ItemsList
                key={item.id}
                item={item}
                showDeleteButton={false}
                selectedItem={selectedItem}
                onEdit={(editItem: Item) => setSelectedItem(editItem)}
              />
            )}
          />
        </SwipeableDrawer>
      )}
    </>
  );
};
export const ItemsDropdown = memo(ItemsDropdownComponent);
