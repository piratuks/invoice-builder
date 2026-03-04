import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { useUnitAdd } from '../../shared/hooks/units/useUnitAdd';
import { useUnitAddBatch } from '../../shared/hooks/units/useUnitAddBatch';
import { useUnitDelete } from '../../shared/hooks/units/useUnitDelete';
import { useUnitsRetrieve } from '../../shared/hooks/units/useUnitsRetrieve';
import { useUnitUpdate } from '../../shared/hooks/units/useUnitUpdate';
import type { Rows } from '../../shared/types/excel';
import type { Filter, FilterData } from '../../shared/types/filter';
import type { Response } from '../../shared/types/response';
import type { Unit, UnitAdd, UnitUpdate } from '../../shared/types/unit';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isUnitFromData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const UnitsPage: FC = () => {
  const { t } = useTranslation();
  const excelColumns = ['name', 'isArchived'];
  const excelFileName = 'units';
  const excelTemplateData: Rows = [
    {
      name: 'pcs',
      isArchived: false
    },
    {
      name: 'hrs',
      isArchived: false
    }
  ];
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'units', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'units' })
  ];
  const useUnitsCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Unit[]>) => void }) => {
    const { units, execute } = useUnitsRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: units, execute };
  };
  const useUnitCRUDAdd = (args: { item?: UnitAdd; immediate?: boolean; onDone?: (data: Response<Unit>) => void }) => {
    return useUnitAdd({
      unit: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useUnitsCRUDAddBatch = (args: {
    item?: UnitAdd[];
    immediate?: boolean;
    onDone?: (data: Response<UnitAdd[]>) => void;
  }) => {
    return useUnitAddBatch({
      units: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useUnitCRUDUpdate = (args: {
    item?: UnitUpdate;
    immediate?: boolean;
    onDone?: (data: Response<Unit>) => void;
  }) => {
    return useUnitUpdate({
      unit: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  return (
    <CRUDPage<Unit, UnitAdd, UnitUpdate>
      componentId="unists"
      title={t('common.unit')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useUnitsCRUDRetrieve}
      useAdd={useUnitCRUDAdd}
      useAddBatch={useUnitsCRUDAddBatch}
      useUpdate={useUnitCRUDUpdate}
      useDelete={useUnitDelete}
      searchField={'name'}
      sortOptions={[
        { label: t('common.name'), value: 'name' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('units.add')}
      noItemText={t('units.noItem')}
      leftTitle={t('menuItems.units')}
      validateAndNormalize={async data => {
        if (!isUnitFromData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: Unit) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          unit={item}
          handleChange={d => {
            if (isUnitFromData(d.unit)) {
              onChange({
                changedData: d.unit,
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
