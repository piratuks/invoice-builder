import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAddCategoriesBatchMutation,
  useAddCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation
} from '../../shared/api/categoriesApi';
import { CRUDPageRTK } from '../../shared/components/layout/crudPage/CRUDPageRTK';
import { FilterType } from '../../shared/enums/filterType';
import type { Category, CategoryAdd, CategoryUpdate } from '../../shared/types/category';
import type { Rows } from '../../shared/types/excel';
import type { Filter } from '../../shared/types/filter';
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

  return (
    <CRUDPageRTK<Category, CategoryAdd, CategoryUpdate>
      componentId="categories"
      title={t('common.category')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useGetCategoriesQuery}
      useAdd={useAddCategoryMutation}
      useAddBatch={useAddCategoriesBatchMutation}
      useUpdate={useUpdateCategoryMutation}
      useDelete={useDeleteCategoryMutation}
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
