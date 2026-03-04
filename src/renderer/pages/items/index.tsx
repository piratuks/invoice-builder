import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { useItemAdd } from '../../shared/hooks/items/useItemAdd';
import { useItemAddBatch } from '../../shared/hooks/items/useItemAddBatch';
import { useItemDelete } from '../../shared/hooks/items/useItemDelete';
import { useItemsRetrieve } from '../../shared/hooks/items/useItemsRetrieve';
import { useItemUpdate } from '../../shared/hooks/items/useItemUpdate';
import type { Rows } from '../../shared/types/excel';
import type { Filter, FilterData } from '../../shared/types/filter';
import type { Item, ItemAdd, ItemUpdate } from '../../shared/types/item';
import type { Response } from '../../shared/types/response';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isItemFromData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const ItemsPage: FC = () => {
  const { t } = useTranslation();

  const excelColumns = ['name', 'amount', 'unitName', 'categoryName', 'description', 'isArchived'];
  const excelFileName = 'items';
  const excelTemplateData: Rows = [
    {
      name: 'Paper A4',
      amount: '5',
      categoryName: 'Goods',
      unitName: 'pack',
      description: 'Standard white A4 paper',
      isArchived: false
    },
    {
      name: 'Pen Blue',
      amount: '150',
      categoryName: 'Goods',
      unitName: 'pcs',
      description: 'Blue ballpoint pen',
      isArchived: false
    }
  ];
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'items', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'items' })
  ];
  const useItemsCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Item[]>) => void }) => {
    const { items, execute } = useItemsRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: items, execute };
  };
  const useItemCRUDAdd = (args: { item?: ItemAdd; immediate?: boolean; onDone?: (data: Response<Item>) => void }) => {
    return useItemAdd({
      item: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useItemsCRUDAddBatch = (args: {
    item?: ItemAdd[];
    immediate?: boolean;
    onDone?: (data: Response<ItemAdd[]>) => void;
  }) => {
    return useItemAddBatch({
      items: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useItemCRUDUpdate = (args: {
    item?: ItemUpdate;
    immediate?: boolean;
    onDone?: (data: Response<Item>) => void;
  }) => {
    return useItemUpdate({
      item: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };

  return (
    <CRUDPage<Item, ItemAdd, ItemUpdate>
      componentId="items"
      title={t('items.title')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useItemsCRUDRetrieve}
      useAdd={useItemCRUDAdd}
      useAddBatch={useItemsCRUDAddBatch}
      useUpdate={useItemCRUDUpdate}
      useDelete={useItemDelete}
      searchField={'name'}
      sortOptions={[
        { label: t('common.name'), value: 'name' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('items.add')}
      noItemText={t('items.noItem')}
      leftTitle={t('menuItems.items')}
      validateAndNormalize={async data => {
        if (!isItemFromData(data)) return;

        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: Item) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          item={item}
          handleChange={d => {
            if (isItemFromData(d.item)) {
              onChange({
                changedData: d.item,
                isFormValid: d.isFormValid,
                description: d.description
              });
            }
          }}
        />
      )}
    />
  );
};
