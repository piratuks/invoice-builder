import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { useLayoutAdd } from '../../shared/hooks/layouts/useLayoutAdd';
import { useLayoutDelete } from '../../shared/hooks/layouts/useLayoutDelete';
import { useLayoutsRetrieve } from '../../shared/hooks/layouts/useLayoutsRetrieve';
import { useLayoutUpdate } from '../../shared/hooks/layouts/useLayoutUpdate';
import type { Filter, FilterData } from '../../shared/types/filter';
import { type Layout, type LayoutAdd, type LayoutUpdate } from '../../shared/types/layouts';
import type { Response } from '../../shared/types/response';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isLayoutData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const LayoutsPage: FC = () => {
  const { t } = useTranslation();

  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'layouts', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'layouts' })
  ];
  const useLayoutsCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Layout[]>) => void }) => {
    const { layouts, execute } = useLayoutsRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: layouts, execute };
  };
  const useLayoutCRUDAdd = (args: {
    item?: LayoutAdd;
    immediate?: boolean;
    onDone?: (data: Response<Layout>) => void;
  }) => {
    return useLayoutAdd({
      layout: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useLayoutCRUDUpdate = (args: {
    item?: LayoutUpdate;
    immediate?: boolean;
    onDone?: (data: Response<Layout>) => void;
  }) => {
    return useLayoutUpdate({
      layout: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  return (
    <CRUDPage<Layout, LayoutAdd, LayoutUpdate>
      componentId="layouts"
      title={t('common.layout')}
      filters={filters}
      useRetrieve={useLayoutsCRUDRetrieve}
      useAdd={useLayoutCRUDAdd}
      useUpdate={useLayoutCRUDUpdate}
      useDelete={useLayoutDelete}
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
