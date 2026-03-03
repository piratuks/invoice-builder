import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { useClientAdd } from '../../shared/hooks/clients/useClientAdd';
import { useClientAddBatch } from '../../shared/hooks/clients/useClientAddBatch';
import { useClientDelete } from '../../shared/hooks/clients/useClientDelete';
import { useClientsRetrieve } from '../../shared/hooks/clients/useClientsRetrieve';
import { useClientUpdate } from '../../shared/hooks/clients/useClientUpdate';
import type { Client, ClientAdd, ClientUpdate } from '../../shared/types/client';
import type { Rows } from '../../shared/types/excel';
import type { Filter, FilterData } from '../../shared/types/filter';
import type { Response } from '../../shared/types/response';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isClientFromData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const ClientsPage: FC = () => {
  const { t } = useTranslation();
  const excelColumns = [
    'name',
    'shortName',
    'address',
    'email',
    'phone',
    'code',
    'description',
    'additional',
    'vatCode',
    'isArchived',
    'peppolEndpointId',
    'countryCode',
    'peppolEndpointSchemeId',
    'buyerReference'
  ];
  const excelFileName = 'clients';
  const excelTemplateData: Rows = [
    {
      name: 'John Doe',
      shortName: 'JD',
      address: '123 Main St, Springfield',
      email: 'john.doe@email.com',
      phone: '+14155552671',
      code: 'A001',
      description: 'Some description',
      vatCode: 'VAT DE123456789',
      isArchived: false,
      peppolEndpointId: '0192',
      countryCode: 'GB',
      peppolEndpointSchemeId: '123456785',
      buyerReference: 'Accounting'
    },
    {
      name: 'Jane Smith',
      shortName: 'JS',
      address: '456 Elm St, Shelbyville',
      email: 'jane.smith@email.com',
      phone: '+14155552671',
      code: 'B002',
      isArchived: false,
      peppolEndpointId: '0192',
      countryCode: 'GB',
      peppolEndpointSchemeId: '123456785',
      buyerReference: 'Accounting'
    }
  ];
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'clients', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'clients' })
  ];
  const useClientsCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Client[]>) => void }) => {
    const { clients, execute } = useClientsRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: clients, execute };
  };
  const useClientCRUDAdd = (args: {
    item?: ClientAdd;
    immediate?: boolean;
    onDone?: (data: Response<ClientAdd>) => void;
  }) => {
    return useClientAdd({
      client: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useClientsCRUDAddBatch = (args: {
    item?: ClientAdd[];
    immediate?: boolean;
    onDone?: (data: Response<ClientAdd[]>) => void;
  }) => {
    return useClientAddBatch({
      clients: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useClientCRUDUpdate = (args: {
    item?: ClientUpdate;
    immediate?: boolean;
    onDone?: (data: Response<ClientUpdate>) => void;
  }) => {
    return useClientUpdate({
      client: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };

  return (
    <CRUDPage<Client, ClientAdd, ClientUpdate>
      componentId="clients"
      title={t('common.client')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useClientsCRUDRetrieve}
      useAdd={useClientCRUDAdd}
      useAddBatch={useClientsCRUDAddBatch}
      useUpdate={useClientCRUDUpdate}
      useDelete={useClientDelete}
      searchField={'name'}
      sortOptions={[
        { label: t('common.name'), value: 'name' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('clients.add')}
      noItemText={t('clients.noItem')}
      leftTitle={t('menuItems.clients')}
      validateAndNormalize={async data => {
        if (!isClientFromData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: Client) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          client={item}
          handleChange={d => {
            if (isClientFromData(d.client)) {
              onChange({
                changedData: d.client,
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
