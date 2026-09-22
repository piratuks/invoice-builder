import { useTranslation } from 'react-i18next';
import {
  useAddStyleProfileMutation,
  useAddStyleProfilesBatchMutation,
  useDeleteStyleProfileMutation,
  useGetStyleProfilesQuery,
  useUpdateStyleProfileMutation
} from '../../shared/api/styleProfilesApi';
import { CRUDPageRTK } from '../../shared/components/layout/crudPage/CRUDPageRTK';
import { FilterType } from '../../shared/enums/filterType';
import type { Rows } from '../../shared/types/excel';
import type { Filter } from '../../shared/types/filter';
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

  return (
    <CRUDPageRTK<StyleProfile, StyleProfileAdd, StyleProfileUpdate>
      componentId="styleprofiles"
      title={t('styleProfiles.title')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useGetStyleProfilesQuery}
      useAdd={useAddStyleProfileMutation}
      useAddBatch={useAddStyleProfilesBatchMutation}
      useUpdate={useUpdateStyleProfileMutation}
      useDelete={useDeleteStyleProfileMutation}
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
