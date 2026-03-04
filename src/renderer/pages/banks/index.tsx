import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { useBankAdd } from '../../shared/hooks/banks/useBankAdd';
import { useBankAddBatch } from '../../shared/hooks/banks/useBankAddBatch';
import { useBankDelete } from '../../shared/hooks/banks/useBankDelete';
import { useBanksRetrieve } from '../../shared/hooks/banks/useBanksRetrieve';
import { useBankUpdate } from '../../shared/hooks/banks/useBankUpdate';
import type { Bank, BankAdd, BankUpdate } from '../../shared/types/bank';
import type { Rows } from '../../shared/types/excel';
import type { Filter, FilterData } from '../../shared/types/filter';
import type { Response } from '../../shared/types/response';
import { createCommonFilters, createInvoiceFilters } from '../../shared/utils/filterSortFunctions';
import { isBankFromData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const BanksPage: FC = () => {
  const { t } = useTranslation();
  const excelColumns = [
    'name',
    'bankName',
    'accountNumber',
    'swiftCode',
    'address',
    'branchCode',
    'routingNumber',
    'accountHolder',
    'sortOrder',
    'type',
    'upiCode',
    'qrCodeFileSize',
    'qrCodeFileType',
    'qrCodeFileName',
    'isArchived'
  ];

  const excelFileName = 'banks';
  const excelTemplateData: Rows = [
    {
      name: 'Swedbank Business Account',
      bankName: 'Swedbank AB',
      accountNumber: 'LT12 7300 0101 2345 6789',
      swiftCode: 'HABALT22',
      address: 'Konstitucijos pr. 20A, 09321 Vilnius, Lithuania',
      branchCode: '73000',
      routingNumber: null,
      type: 'Business Current Account',
      upiCode: null,
      isArchived: false,
      accountHolder: 'Tom Hanks',
      sortOrder: null
    },
    {
      name: 'Stripe Payout Account',
      bankName: 'Bank of America',
      accountNumber: '123456789',
      swiftCode: 'BOFAUS3N',
      address: '100 N Tryon St, Charlotte, NC 28202, USA',
      branchCode: null,
      routingNumber: '026009593',
      type: 'Checking',
      upiCode: null,
      isArchived: false,
      accountHolder: 'Tom Hanks',
      sortOrder: null
    },
    {
      name: 'Personal UPI Wallet',
      bankName: 'HDFC Bank',
      accountNumber: '50100234567890',
      swiftCode: 'HDFCINBBXXX',
      address: 'HDFC Bank, Sion Branch, Mumbai, Maharashtra, India',
      branchCode: '044',
      routingNumber: null,
      type: 'Savings Account',
      upiCode: 'rahul.verma@okhdfcbank',
      isArchived: false,
      accountHolder: 'Tom Hanks',
      sortOrder: null
    }
  ];
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'banks', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'banks' })
  ];
  const useBanksCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Bank[]>) => void }) => {
    const { banks, execute } = useBanksRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: banks, execute };
  };
  const useBankCRUDAdd = (args: { item?: BankAdd; immediate?: boolean; onDone?: (data: Response<Bank>) => void }) => {
    return useBankAdd({
      bank: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useBanksCRUDAddBatch = (args: {
    item?: BankAdd[];
    immediate?: boolean;
    onDone?: (data: Response<BankAdd[]>) => void;
  }) => {
    return useBankAddBatch({
      banks: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useBankCRUDUpdate = (args: {
    item?: BankUpdate;
    immediate?: boolean;
    onDone?: (data: Response<Bank>) => void;
  }) => {
    return useBankUpdate({
      bank: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  return (
    <CRUDPage<Bank, BankAdd, BankUpdate>
      componentId="banks"
      title={t('common.bank')}
      filters={filters}
      excelData={{ excelColumns, excelFileName, excelFormat: 'xlsx', excelTemplateData }}
      useRetrieve={useBanksCRUDRetrieve}
      useAdd={useBankCRUDAdd}
      useAddBatch={useBanksCRUDAddBatch}
      useUpdate={useBankCRUDUpdate}
      useDelete={useBankDelete}
      searchField={'name'}
      sortOptions={[
        { label: t('common.name'), value: 'name' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('banks.add')}
      noItemText={t('banks.noItem')}
      leftTitle={t('menuItems.banks')}
      validateAndNormalize={async data => {
        if (!isBankFromData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: Bank) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          bank={item}
          handleChange={d => {
            if (isBankFromData(d.bank)) {
              onChange({
                changedData: d.bank,
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
