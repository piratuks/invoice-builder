import { useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../shared/enums/filterType';
import { InvoiceFormMode } from '../../shared/enums/invoiceFormMode';
import { InvoiceStatus } from '../../shared/enums/invoiceStatus';
import { InvoiceType } from '../../shared/enums/invoiceType';
import { useInvoiceAdd } from '../../shared/hooks/invoices/useInvoiceAdd';
import { useInvoiceDelete } from '../../shared/hooks/invoices/useInvoiceDelete';
import { useInvoiceDuplicate } from '../../shared/hooks/invoices/useInvoiceDuplicate';
import { useInvoicesRetrieve } from '../../shared/hooks/invoices/useInvoicesRetrieve';
import { useInvoiceUpdate } from '../../shared/hooks/invoices/useInvoiceUpdate';
import type { Row } from '../../shared/types/excel';
import type { Filter, FilterData } from '../../shared/types/filter';
import type { Invoice, InvoiceAdd, InvoiceItem, InvoiceUpdate } from '../../shared/types/invoice';
import type { Preset } from '../../shared/types/preset';
import type { Response } from '../../shared/types/response';
import { exportExcel } from '../../shared/utils/fileFunctions';
import { createCommonFilters } from '../../shared/utils/filterSortFunctions';
import { isInvoiceFromData } from '../../shared/utils/typeGuardFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectBusinessesSnapshotsOptions, selectClientsSnapshotsOptions, selectSettings } from '../../state/pageSlice';
import { NewActionDropdown } from './Dropdowns/NewActionDropdown';

import { Form } from './Form';
import { EditPreviewToggle } from './Form/EditPreviewToggle';
import { List } from './List';

interface Props {
  type: InvoiceType;
}
export const InvoicesPage: FC<Props> = ({ type }) => {
  const { t } = useTranslation();
  const clientsOptions = useAppSelector(selectClientsSnapshotsOptions);
  const businessesOptions = useAppSelector(selectBusinessesSnapshotsOptions);
  const settings = useAppSelector(selectSettings);
  const filters: Filter[] = [
    ...createCommonFilters({
      t,
      namespace: type === InvoiceType.quotation ? 'quotes' : 'invoices',
      initial: FilterType.active,
      shouldCloseOnClick: false
    }),
    {
      label: t('common.client'),
      type: FilterType.client,
      options: clientsOptions
    },
    {
      label: t('menuItems.businesses'),
      type: FilterType.business,
      options: businessesOptions
    },
    {
      label: t('invoices.filter.date'),
      type: FilterType.date
    },
    {
      type: FilterType.status,
      label: t('common.status'),
      value: FilterType.status,
      options:
        type === InvoiceType.quotation
          ? [
              { label: InvoiceStatus.open, value: InvoiceStatus.open },
              { label: InvoiceStatus.closed, value: InvoiceStatus.closed }
            ]
          : [
              { label: InvoiceStatus.unpaid, value: InvoiceStatus.unpaid },
              { label: InvoiceStatus.partiallyPaid, value: InvoiceStatus.partiallyPaid },
              { label: InvoiceStatus.paid, value: InvoiceStatus.paid },
              { label: InvoiceStatus.closed, value: InvoiceStatus.closed }
            ]
    }
  ];
  const useInvoicesCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Invoice[]>) => void }) => {
    const { invoices, execute } = useInvoicesRetrieve({ type, filter: args.filter, onDone: args.onDone });
    return { items: invoices, execute };
  };
  const useInvoiceCRUDAdd = (args: {
    item?: InvoiceAdd;
    immediate?: boolean;
    onDone?: (data: Response<Invoice>) => void;
  }) => {
    return useInvoiceAdd({
      invoice: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const useInvoiceCRUDUpdate = (args: {
    item?: InvoiceUpdate;
    immediate?: boolean;
    onDone?: (data: Response<Invoice>) => void;
  }) => {
    return useInvoiceUpdate({
      invoice: args.item,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };

  const [currType, setCurrType] = useState<InvoiceType>(type);
  const useInvoiceCRUDDuplicate = (args: {
    id: number;
    immediate?: boolean;
    onDone?: (data: Response<unknown>) => void;
  }) => {
    return useInvoiceDuplicate({
      id: args.id,
      invoiceType: currType,
      immediate: args.immediate,
      onDone: args.onDone
    });
  };
  const exportInvoices = useCallback(
    async (invoices: Invoice[]) => {
      const mapBusinessSnapshot = (inv: Invoice) => {
        if (!inv.invoiceBusinessSnapshot) return;

        const { businessLogo, ...rest } = inv.invoiceBusinessSnapshot;

        void businessLogo;

        return rest;
      };
      const mapItemSnapshot = (inv: Invoice) =>
        (inv.invoiceItems ?? []).map(it => it.invoiceItemSnapshot).filter(Boolean);

      const mapCustomization = (inv: Invoice) => {
        if (!inv.invoiceCustomization) return;

        const { watermarkFileData, paidWatermarkFileData, ...rest } = inv.invoiceCustomization;

        void watermarkFileData;
        void paidWatermarkFileData;

        return rest;
      };
      const mapProfileSnapshot = (inv: Invoice) => inv.invoiceStyleProfileSnapshot;
      const mapCurrencySnapshot = (inv: Invoice) => inv.invoiceCurrencySnapshot;
      const mapClientSnapshot = (inv: Invoice) => inv.invoiceClientSnapshot;
      const mapPayment = (inv: Invoice) => (inv.invoicePayments ?? []).map(p => p);
      const mapItem = (inv: Invoice) => (inv.invoiceItems ?? []).map(cleanItem);
      const isRow = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v);
      const toRow = (obj: unknown): Row | undefined =>
        obj ? (Object.fromEntries(Object.entries(obj as Record<string, unknown>)) as Row) : undefined;

      const cleanItem = (item: InvoiceItem) => {
        const { invoiceItemSnapshot, ...rest } = item;

        void invoiceItemSnapshot;

        return rest;
      };

      const cleanInvoice = (invoice: Invoice) => {
        const {
          invoicePayments,
          invoiceItems,
          currencyFormat,
          invoiceAttachments,
          invoiceCustomization,
          signatureData,
          invoiceBusinessSnapshot,
          invoiceClientSnapshot,
          invoiceCurrencySnapshot,
          invoiceStyleProfileSnapshot,
          invoiceFullNumber,
          ...rest
        } = invoice;

        void invoiceFullNumber;
        void invoiceStyleProfileSnapshot;
        void invoiceCustomization;
        void invoiceCurrencySnapshot;
        void invoicePayments;
        void invoiceItems;
        void currencyFormat;
        void invoiceBusinessSnapshot;
        void invoiceClientSnapshot;
        void signatureData;
        void invoiceAttachments;

        return rest;
      };

      const invoicesData = invoices;
      const invoicesSheet = invoicesData.map(cleanInvoice);
      const invoiceStyleProfileSnapshotSheet = invoicesData.flatMap(mapProfileSnapshot);
      const invoiceClientSnapshotsSheet = invoicesData.flatMap(mapClientSnapshot);
      const invoiceBusinessSnapshotSheet = invoicesData.flatMap(mapBusinessSnapshot);
      const invoiceCustomization = invoicesData.flatMap(mapCustomization);
      const invoiceCurrencySnapshotsSheet = invoicesData.flatMap(mapCurrencySnapshot);
      const itemsSheet = invoicesData.flatMap(mapItem);
      const paymentsSheet = invoicesData.flatMap(mapPayment);
      const itemSnapshotSheet = invoicesData.flatMap(mapItemSnapshot);

      await exportExcel(
        [
          {
            name: type === InvoiceType.quotation ? 'Quotes' : 'Invoices',
            rows: invoicesSheet.map(toRow).filter(isRow)
          },
          { name: 'Business Snapshots', rows: invoiceBusinessSnapshotSheet.map(toRow).filter(isRow) },
          { name: 'Client Snapshots', rows: invoiceClientSnapshotsSheet.map(toRow).filter(isRow) },
          { name: 'Currency Snapshots', rows: invoiceCurrencySnapshotsSheet.map(toRow).filter(isRow) },
          { name: 'Style Profile Snapshots', rows: invoiceStyleProfileSnapshotSheet.map(toRow).filter(isRow) },
          { name: 'Customizations', rows: invoiceCustomization.map(toRow).filter(isRow) },
          { name: 'Payments', rows: paymentsSheet.map(toRow).filter(isRow) },
          { name: 'Items', rows: itemsSheet.map(toRow).filter(isRow) },
          {
            name: 'Item Snapshots',
            rows: itemSnapshotSheet.map(toRow).filter(isRow)
          }
        ],
        type === InvoiceType.quotation ? 'quotations.xlsx' : 'invoices.xlsx'
      );
    },
    [type]
  );
  const [mode, setMode] = useState<InvoiceFormMode>(InvoiceFormMode.edit);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [openDefaultAdd, setOpenDefaultAdd] = useState<(() => void) | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | undefined>(undefined);
  const isPresetsEnabled = useMemo(() => settings?.presetsON, [settings]);

  return (
    <>
      <CRUDPage<Invoice, InvoiceAdd, InvoiceUpdate>
        componentId="invoices"
        renderCustomButtons={() => {
          return <EditPreviewToggle mode={mode} setMode={setMode} />;
        }}
        title={type === InvoiceType.quotation ? t('common.quote') : t('common.invoice')}
        filters={filters}
        showOnlyExport={true}
        inlineOnAdd={true}
        useRetrieve={useInvoicesCRUDRetrieve}
        useAdd={useInvoiceCRUDAdd}
        useUpdate={useInvoiceCRUDUpdate}
        useDuplicate={useInvoiceCRUDDuplicate}
        useDelete={useInvoiceDelete}
        searchField={'invoiceNumber'}
        sortOptions={[
          { label: t('common.status'), value: 'status' },
          { label: t('common.issuedAt'), value: 'issuedAt' },
          {
            label: type === InvoiceType.quotation ? t('common.quoteNumber') : t('common.invoiceNumber'),
            value: 'invoiceNumber'
          },
          { label: t('common.lastUpdate'), value: 'updatedAt' }
        ]}
        noItemButtonText={type === InvoiceType.quotation ? t('invoices.addQuote') : t('invoices.addInvoice')}
        noItemText={type === InvoiceType.quotation ? t('invoices.noItemQuote') : t('invoices.noItemInvoice')}
        leftTitle={type === InvoiceType.quotation ? t('menuItems.quotes') : t('menuItems.invoices')}
        exportExcelHandler={exportInvoices}
        onAddClick={defaultOnAdd => {
          if (!isPresetsEnabled) {
            defaultOnAdd();
            return;
          }

          setOpenDefaultAdd(() => defaultOnAdd);
          setIsAddDropdownOpen(true);
        }}
        validateAndNormalize={async data => {
          if (!isInvoiceFromData(data)) return;
          return data;
        }}
        renderListItem={(item, selectedItem, onEdit) => (
          <List
            key={item.id}
            item={item}
            isSelected={item.id === selectedItem?.id}
            onEdit={(editItem: Invoice) => {
              setSelectedPreset(undefined);
              onEdit(editItem);
            }}
          />
        )}
        form={({ item, onChange, onDelete, onDuplicate }) => (
          <Form
            invoice={item}
            type={type}
            mode={mode}
            preset={selectedPreset}
            handleDuplicate={(id, invoiceType) => {
              setCurrType(invoiceType);
              if (onDuplicate) onDuplicate(id);
            }}
            handleChange={d => {
              if (isInvoiceFromData(d.invoice)) {
                onChange({
                  changedData: d.invoice,
                  isFormValid: d.isFormValid,
                  description: d.description
                });
              }
            }}
            handleDelete={id => {
              if (onDelete) onDelete(id);
            }}
          />
        )}
      />

      <NewActionDropdown
        isOpen={isAddDropdownOpen}
        onClose={() => setIsAddDropdownOpen(false)}
        onOpen={() => setIsAddDropdownOpen(true)}
        onNew={() => {
          setSelectedPreset(undefined);
          setIsAddDropdownOpen(false);
          if (openDefaultAdd) {
            openDefaultAdd();
          }
        }}
        onNewFromPreset={data => {
          setIsAddDropdownOpen(false);
          if (openDefaultAdd) {
            openDefaultAdd();
          }
          setSelectedPreset({ ...data });
        }}
      />
    </>
  );
};
