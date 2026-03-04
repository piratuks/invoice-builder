import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { useCategoriesRetrieve } from '../../shared/hooks/categories/useCategoriesRetrieve';
import { useCategoryAdd } from '../../shared/hooks/categories/useCategoryAdd';
import { useCategoryAddBatch } from '../../shared/hooks/categories/useCategoryAddBatch';
import { useCategoryDelete } from '../../shared/hooks/categories/useCategoryDelete';
import { useCategoryUpdate } from '../../shared/hooks/categories/useCategoryUpdate';
import type { Category, CategoryAdd, CategoryUpdate } from '../../shared/types/category';
import type { Rows } from '../../shared/types/excel';
import type { Filter, FilterData } from '../../shared/types/filter';
import type { Response } from '../../shared/types/response';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isCategoryFromData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const CategoriesPage: FC = () => {
  const { t } = useTranslation();
  const excelColumns = ['name', 'isArchived'];
  const excelFileName = 'categories';
  const excelTemplateData: Rows = [
    {
      name: 'Goods',
      isArchived: false
    },
    {
      name: 'Services',
      isArchived: false
    }
  ];
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'categories', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'categories' })
  ];
  const useCategoriesCRUDRetrieve = (args: {
    filter?: FilterData[];
    onDone?: (data: Response<Category[]>) => void;
  }) => {
    const { categories, execute } = useCategoriesRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: categories, execute };
  };
  const useCategoryCRUDAdd = (args: {
    item?: CategoryAdd;
    immediate?: boolean;
    onDone?: (data: Response<Category>) => void;
  }) => {
    return useCategoryAdd({
      category: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useCategoriesCRUDAddBatch = (args: {
    item?: CategoryAdd[];
    immediate?: boolean;
    onDone?: (data: Response<CategoryAdd[]>) => void;
  }) => {
    return useCategoryAddBatch({
      categories: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useCategoryCRUDUpdate = (args: {
    item?: CategoryUpdate;
    immediate?: boolean;
    onDone?: (data: Response<Category>) => void;
  }) => {
    return useCategoryUpdate({
      category: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };

  return (
    <CRUDPage<Category, CategoryAdd, CategoryUpdate>
      componentId="categories"
      title={t('common.category')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useCategoriesCRUDRetrieve}
      useAdd={useCategoryCRUDAdd}
      useAddBatch={useCategoriesCRUDAddBatch}
      useUpdate={useCategoryCRUDUpdate}
      useDelete={useCategoryDelete}
      searchField={'name'}
      sortOptions={[
        { label: t('common.name'), value: 'name' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('categories.add')}
      noItemText={t('categories.noItem')}
      leftTitle={t('menuItems.categories')}
      validateAndNormalize={async data => {
        if (!isCategoryFromData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: Category) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          category={item}
          handleChange={d => {
            if (isCategoryFromData(d.category)) {
              onChange({
                changedData: d.category,
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
