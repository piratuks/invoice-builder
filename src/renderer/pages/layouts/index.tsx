import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAddLayoutMutation,
  useDeleteLayoutMutation,
  useGetLayoutsQuery,
  useUpdateLayoutMutation
} from '../../shared/api/layoutsApi';
import { CRUDPageRTK } from '../../shared/components/layout/crudPage/CRUDPageRTK';
import { FilterType } from '../../shared/enums/filterType';
import { InvoiceFormMode } from '../../shared/enums/invoiceFormMode';
import type { Filter } from '../../shared/types/filter';
import { type Layout, type LayoutAdd, type LayoutUpdate } from '../../shared/types/layouts';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isLayoutData } from '../../shared/utils/typeGuardFunctions';
import { EditPreviewToggle } from '../invoices/Form/EditPreviewToggle';
import { Form } from './Form';
import { List } from './List';

export const LayoutsPage: FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<InvoiceFormMode>(InvoiceFormMode.edit);

  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'layouts', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'layouts' })
  ];
  return (
    <CRUDPageRTK<Layout, LayoutAdd, LayoutUpdate>
      componentId="layouts"
      renderCustomButtons={() => <EditPreviewToggle mode={mode} setMode={setMode} />}
      title={t('common.layout')}
      filters={filters}
      useRetrieve={useGetLayoutsQuery}
      useAdd={useAddLayoutMutation}
      useUpdate={useUpdateLayoutMutation}
      useDelete={useDeleteLayoutMutation}
      inlineOnAdd={true}
      searchField={layout => layout.schema.meta.name}
      sortOptions={[
        { label: t('common.name'), value: 'schema', getValue: layout => layout.schema.meta.name },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('layouts.add')}
      noItemText={t('layouts.noItem')}
      leftTitle={t('menuItems.layouts')}
      validateAndNormalize={async data => {
        if (!isLayoutData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: Layout) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          item={item}
          mode={mode}
          handleChange={d => {
            if (isLayoutData(d.layout)) {
              onChange({
                changedData: d.layout,
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
