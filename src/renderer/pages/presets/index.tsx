import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAddPresetMutation,
  useAddPresetsBatchMutation,
  useDeletePresetMutation,
  useGetPresetsQuery,
  useUpdatePresetMutation
} from '../../shared/api/presetsApi';
import { CRUDPageRTK } from '../../shared/components/layout/crudPage/CRUDPageRTK';
import { FilterType } from '../../shared/enums/filterType';
import { Language } from '../../shared/enums/language';
import type { Rows } from '../../shared/types/excel';
import type { Filter } from '../../shared/types/filter';
import type { Preset, PresetAdd, PresetUpdate } from '../../shared/types/preset';
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

  return (
    <CRUDPageRTK<Preset, PresetAdd, PresetUpdate>
      componentId="presets"
      title={t('common.presets')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useGetPresetsQuery}
      useAdd={useAddPresetMutation}
      useAddBatch={useAddPresetsBatchMutation}
      useUpdate={useUpdatePresetMutation}
      useDelete={useDeletePresetMutation}
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
