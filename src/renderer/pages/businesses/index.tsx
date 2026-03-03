import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { useBusinessAdd } from '../../shared/hooks/businesses/useBusinessAdd';
import { useBusinessAddBatch } from '../../shared/hooks/businesses/useBusinessAddBatch';
import { useBusinessDelete } from '../../shared/hooks/businesses/useBusinessDelete';
import { useBusinessesRetrieve } from '../../shared/hooks/businesses/useBusinessesRetrieve';
import { useBusinessUpdate } from '../../shared/hooks/businesses/useBusinessUpdate';
import type { Business, BusinessAdd, BusinessUpdate } from '../../shared/types/business';
import type { Rows } from '../../shared/types/excel';
import type { Filter, FilterData } from '../../shared/types/filter';
import type { Response } from '../../shared/types/response';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isBusinessFromData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const BusinessesPage = () => {
  const { t } = useTranslation();
  const excelColumns = [
    'name',
    'shortName',
    'address',
    'role',
    'email',
    'phone',
    'website',
    'description',
    'additional',
    'vatCode',
    // Legacy payment info. New payment info is via Bank
    'paymentInformation',
    'isArchived',
    'fileSize',
    'fileType',
    'fileName',
    'peppolEndpointId',
    'countryCode',
    'code',
    'peppolEndpointSchemeId'
  ];
  const excelFileName = 'businesses';
  const excelTemplateData: Rows = [
    {
      name: 'Acme Corp',
      shortName: 'AC',
      address: '123 Main St',
      role: 'Manager',
      email: 'acme@example.com',
      phone: '+14155552671',
      website: 'https://acme.com',
      additional: 'AC',
      description: 'Some description',
      isArchived: false,
      peppolEndpointId: '0192',
      countryCode: 'GB',
      code: undefined,
      peppolEndpointSchemeId: '123456785',
      // Legacy payment info. New payment info is via Bank
      paymentInformation:
        '`Cardholder Name: John Doe; Card Type: Visa; Card Number: 4111 1111 1111 1111; Expiration Date: 12/2026; CVV: 123; Billing Address: 123 Main Street, Apt 4B, Springfield, IL 62704; Payment Method: Credit Card; Transaction ID: TXN1234567890; Payment Status: Completed; Amount Paid: $250.00 USD; Currency: USD; Payment Date: 2025-11-17`'
    },
    {
      name: 'Beta Industries',
      shortName: 'BI',
      address: '456 Second Ave',
      email: 'beta@example.com',
      phone: '+14155552671',
      website: 'https://beta.com',
      additional: 'BI',
      isArchived: true,
      peppolEndpointId: '0192',
      countryCode: 'GB',
      peppolEndpointSchemeId: '123456785'
    }
  ];
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'businesses', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'businesses' })
  ];
  const useBusinessesCRUDRetrieve = (args: {
    filter?: FilterData[];
    onDone?: (data: Response<Business[]>) => void;
  }) => {
    const { businesses, execute } = useBusinessesRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: businesses, execute };
  };
  const useBusinessCRUDAdd = (args: {
    item?: BusinessAdd;
    immediate?: boolean;
    onDone?: (data: Response<BusinessAdd>) => void;
  }) => {
    return useBusinessAdd({
      business: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useBusinessesCRUDAddBatch = (args: {
    item?: BusinessAdd[];
    immediate?: boolean;
    onDone?: (data: Response<BusinessAdd[]>) => void;
  }) => {
    return useBusinessAddBatch({
      businesses: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useBusinessCRUDUpdate = (args: {
    item?: BusinessUpdate;
    immediate?: boolean;
    onDone?: (data: Response<BusinessUpdate>) => void;
  }) => {
    return useBusinessUpdate({
      business: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };

  return (
    <CRUDPage<Business, BusinessAdd, BusinessUpdate>
      componentId="businesses"
      title={t('businesses.title')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useBusinessesCRUDRetrieve}
      useAdd={useBusinessCRUDAdd}
      useAddBatch={useBusinessesCRUDAddBatch}
      useUpdate={useBusinessCRUDUpdate}
      useDelete={useBusinessDelete}
      searchField={'name'}
      sortOptions={[
        { label: t('common.name'), value: 'name' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('businesses.add')}
      noItemText={t('businesses.noItem')}
      leftTitle={t('menuItems.businesses')}
      validateAndNormalize={async data => {
        if (!isBusinessFromData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: Business) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          business={item}
          handleChange={d => {
            if (isBusinessFromData(d.business)) {
              onChange({
                changedData: d.business,
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
