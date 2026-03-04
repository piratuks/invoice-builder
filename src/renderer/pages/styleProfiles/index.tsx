import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { useStyleProfileAdd } from '../../shared/hooks/styleProfiles/useStyleProfileAdd';
import { useStyleProfileAddBatch } from '../../shared/hooks/styleProfiles/useStyleProfileAddBatch';
import { useStyleProfileDelete } from '../../shared/hooks/styleProfiles/useStyleProfileDelete';
import { useStyleProfilesRetrieve } from '../../shared/hooks/styleProfiles/useStyleProfilesRetrieve';
import { useStyleProfileUpdate } from '../../shared/hooks/styleProfiles/useStyleProfileUpdate';
import type { Rows } from '../../shared/types/excel';
import type { Filter, FilterData } from '../../shared/types/filter';
import type { Response } from '../../shared/types/response';
import type { StyleProfile, StyleProfileAdd, StyleProfileUpdate } from '../../shared/types/styleProfiles';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isStyleProfileFromData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const StyleProfilesPage = () => {
  const { t } = useTranslation();
  const excelColumns = [
    'name',
    'color',
    'logoSize',
    'fontSize',
    'fontFamily',
    'layout',
    'tableHeaderStyle',
    'tableRowStyle',
    'pageFormat',
    'labelUpperCase',
    'watermarkFileName',
    'watermarkFileType',
    'watermarkFileSize',
    'paidWatermarkFileName',
    'paidWatermarkFileType',
    'paidWatermarkFileSize',
    'isArchived',
    'showQuantity',
    'showUnit',
    'showRowNo',
    'fieldSortOrders',
    'pdfTexts'
  ];
  const excelFileName = 'style_profiles';
  const excelTemplateData: Rows = [
    {
      name: 'Test Profile',
      color: '#006400',
      logoSize: 'medium',
      fontSize: 'medium',
      FontFamily: 'Roboto',
      layout: 'classic',
      tableHeaderStyle: 'light',
      tableRowStyle: 'classic',
      pageFormat: 'A4',
      labelUpperCase: true,
      isArchived: false,
      showQuantity: true,
      showUnit: true,
      showRowNo: true,
      fieldSortOrders: `{"total":0,"no":1,"item":2,"unit":3,"quantity":4,"unitCost":5}`,
      pdfTexts: `{"billTo":"Billing","invoiceNo":"Number"}`
    }
  ];
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'styleProfiles', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'styleProfiles' })
  ];
  const useStyleProfilesCRUDRetrieve = (args: {
    filter?: FilterData[];
    onDone?: (data: Response<StyleProfile[]>) => void;
  }) => {
    const { styleProfiles, execute } = useStyleProfilesRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: styleProfiles, execute };
  };
  const useStyleProfileCRUDAdd = (args: {
    item?: StyleProfileAdd;
    immediate?: boolean;
    onDone?: (data: Response<StyleProfile>) => void;
  }) => {
    return useStyleProfileAdd({
      styleProfile: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useStyleProfilesCRUDAddBatch = (args: {
    item?: StyleProfileAdd[];
    immediate?: boolean;
    onDone?: (data: Response<StyleProfileAdd[]>) => void;
  }) => {
    return useStyleProfileAddBatch({
      styleProfiles: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useStyleProfileCRUDUpdate = (args: {
    item?: StyleProfileUpdate;
    immediate?: boolean;
    onDone?: (data: Response<StyleProfile>) => void;
  }) => {
    return useStyleProfileUpdate({
      styleProfile: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };

  return (
    <CRUDPage<StyleProfile, StyleProfileAdd, StyleProfileUpdate>
      componentId="styleprofiles"
      title={t('styleProfiles.title')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useStyleProfilesCRUDRetrieve}
      useAdd={useStyleProfileCRUDAdd}
      useAddBatch={useStyleProfilesCRUDAddBatch}
      useUpdate={useStyleProfileCRUDUpdate}
      useDelete={useStyleProfileDelete}
      searchField={'name'}
      sortOptions={[
        { label: t('common.name'), value: 'name' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('styleProfiles.add')}
      noItemText={t('styleProfiles.noItem')}
      leftTitle={t('menuItems.styleProfiles')}
      validateAndNormalize={async data => {
        if (!isStyleProfileFromData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: StyleProfile) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          styleProfile={item}
          handleChange={d => {
            if (isStyleProfileFromData(d.styleProfile)) {
              onChange({
                changedData: d.styleProfile,
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
