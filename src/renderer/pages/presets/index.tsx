import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { Language } from '../../shared/enums/language';
import { usePresetAdd } from '../../shared/hooks/presets/usePresetAdd';
import { usePresetAddBatch } from '../../shared/hooks/presets/usePresetAddBatch';
import { usePresetDelete } from '../../shared/hooks/presets/usePresetDelete';
import { usePresetsRetrieve } from '../../shared/hooks/presets/usePresetsRetrieve';
import { usePresetUpdate } from '../../shared/hooks/presets/usePresetUpdate';
import type { Rows } from '../../shared/types/excel';
import type { Filter, FilterData } from '../../shared/types/filter';
import type { Preset, PresetAdd, PresetUpdate } from '../../shared/types/preset';
import type { Response } from '../../shared/types/response';
import { createCommonFilters } from '../../shared/utils/filterSortFunctions';
import { isPresetFromData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const PresetsPage: FC = () => {
  const { t } = useTranslation();
  const excelColumns = [
    'name',
    'businessId',
    'clientId',
    'currencyId',
    'bankId',
    'styleProfilesId',
    'customerNotes',
    'thanksNotes',
    'termsConditionNotes',
    'language',
    'signatureSize',
    'signatureType',
    'signatureName',
    'isArchived'
  ];
  const excelFileName = 'presets';
  const excelTemplateData: Rows = [
    {
      name: 'Core preset',
      businessId: null,
      clientId: null,
      currencyId: null,
      bankId: null,
      styleProfilesId: null,
      customerNotes: 'Customer notes',
      thanksNotes: 'Thanks notes',
      termsConditionNotes: 'Terms and conditions',
      language: Language.en,
      signatureSize: null,
      signatureType: null,
      signatureName: null,
      isArchived: false
    }
  ];
  const filters: Filter[] = [...createCommonFilters({ t, namespace: 'presets', initial: FilterType.active })];

  const usePresetsCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Preset[]>) => void }) => {
    const { presets, execute } = usePresetsRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: presets, execute };
  };
  const usePresetCRUDAdd = (args: {
    item?: PresetAdd;
    immediate?: boolean;
    onDone?: (data: Response<Preset>) => void;
  }) => {
    return usePresetAdd({
      preset: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const usePresetsCRUDAddBatch = (args: {
    item?: PresetAdd[];
    immediate?: boolean;
    onDone?: (data: Response<PresetAdd[]>) => void;
  }) => {
    return usePresetAddBatch({
      presets: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const usePresetCRUDUpdate = (args: {
    item?: PresetUpdate;
    immediate?: boolean;
    onDone?: (data: Response<Preset>) => void;
  }) => {
    return usePresetUpdate({
      preset: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  return (
    <CRUDPage<Preset, PresetAdd, PresetUpdate>
      componentId="presets"
      title={t('common.presets')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={usePresetsCRUDRetrieve}
      useAdd={usePresetCRUDAdd}
      useAddBatch={usePresetsCRUDAddBatch}
      useUpdate={usePresetCRUDUpdate}
      useDelete={usePresetDelete}
      searchField={'name'}
      inlineOnAdd={true}
      sortOptions={[
        { label: t('common.name'), value: 'name' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('presets.add')}
      noItemText={t('presets.noItem')}
      leftTitle={t('menuItems.presets')}
      validateAndNormalize={async data => {
        if (!isPresetFromData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: Preset) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          preset={item}
          handleChange={d => {
            if (isPresetFromData(d.preset)) {
              onChange({
                changedData: d.preset,
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
