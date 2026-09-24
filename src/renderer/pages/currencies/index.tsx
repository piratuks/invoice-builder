import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAddCurrenciesBatchMutation,
  useAddCurrencyMutation,
  useDeleteCurrencyMutation,
  useGetCurrenciesQuery,
  useUpdateCurrencyMutation
} from '../../shared/api/currenciesApi';
import { CRUDPageRTK } from '../../shared/components/layout/crudPage/CRUDPageRTK';
import { FilterType } from '../../shared/enums/filterType';
import type { Currency, CurrencyAdd, CurrencyUpdate } from '../../shared/types/currency';
import type { Rows } from '../../shared/types/excel';
import type { Filter } from '../../shared/types/filter';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isCurrencyFromData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const CurrenciesPage: FC = () => {
  const { t } = useTranslation();
  const excelColumns = ['code', 'symbol', 'text', 'format', 'subunit', 'isArchived'];
  const excelFileName = 'currencies';
  const excelTemplateData: Rows = [
    {
      code: 'USD',
      symbol: '$',
      text: 'United States Dollar',
      format: '{symbol}{amount}',
      subunit: 100,
      isArchived: false
    },
    {
      code: 'EUR',
      symbol: '€',
      text: 'Euro',
      subunit: 100,
      format: '{symbol}{amount}',
      isArchived: false
    }
  ];
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'currencies', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'currencies' })
  ];

  return (
    <CRUDPageRTK<Currency, CurrencyAdd, CurrencyUpdate>
      componentId="currencies"
      title={t('common.currency')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useGetCurrenciesQuery}
      useAdd={useAddCurrencyMutation}
      useAddBatch={useAddCurrenciesBatchMutation}
      useUpdate={useUpdateCurrencyMutation}
      useDelete={useDeleteCurrencyMutation}
      searchField={'text'}
      sortOptions={[
        { label: t('common.text'), value: 'text' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('currencies.add')}
      noItemText={t('currencies.noItem')}
      leftTitle={t('menuItems.currencies')}
      validateAndNormalize={async data => {
        if (!isCurrencyFromData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: Currency) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          currency={item}
          handleChange={d => {
            if (isCurrencyFromData(d.currency)) {
              onChange({
                changedData: d.currency,
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
