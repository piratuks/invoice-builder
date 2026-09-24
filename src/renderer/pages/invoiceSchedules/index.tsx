import { useCallback, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAddInvoiceScheduleMutation,
  useDeleteInvoiceScheduleMutation,
  useGetInvoiceSchedulesQuery,
  useUpdateInvoiceScheduleMutation
} from '../../shared/api/invoiceSchedulesApi';
import { useGetInvoicesQuery } from '../../shared/api/invoicesApi';
import { CRUDPageRTK } from '../../shared/components/layout/crudPage/CRUDPageRTK';
import { FilterType } from '../../shared/enums/filterType';
import { InvoiceScheduleStatus } from '../../shared/enums/invoiceSchedule';
import { InvoiceType } from '../../shared/enums/invoiceType';
import type { Filter } from '../../shared/types/filter';
import type { InvoiceSchedule, InvoiceScheduleAdd, InvoiceScheduleUpdate } from '../../shared/types/invoiceSchedule';
import { exportExcel } from '../../shared/utils/fileFunctions';
import { createCommonFilters } from '../../shared/utils/filterSortFunctions';
import { isInvoiceScheduleData } from '../../shared/utils/typeGuardFunctions';
import { Form } from './Form';
import { List } from './List';

export const InvoiceSchedulesPage: FC = () => {
  const { t } = useTranslation();
  const { data: invoices = [] } = useGetInvoicesQuery({ invoiceType: InvoiceType.invoice });
  const exportSchedules = useCallback(async (schedules: InvoiceSchedule[]) => {
    await exportExcel(
      [
        {
          name: 'Invoice Schedules',
          rows: schedules.map(schedule => ({
            sourceInvoiceId: schedule.sourceInvoiceId,
            cadence: schedule.cadence,
            intervalCount: schedule.intervalCount,
            timezone: schedule.timezone,
            startAt: schedule.startAt,
            endAt: schedule.endAt ?? '',
            maxOccurrences: schedule.maxOccurrences ?? '',
            nextRunAt: schedule.nextRunAt,
            lastRunAt: schedule.lastRunAt ?? '',
            dueDateOffsetDays: schedule.dueDateOffsetDays,
            status: schedule.status,
            isArchived: schedule.isArchived,
            deliveryMethod: schedule.deliveryMethod,
            failureReason: schedule.failureReason ?? ''
          }))
        }
      ],
      'invoice-schedules.xlsx'
    );
  }, []);

  const filters: Filter[] = [
    ...createCommonFilters({
      t,
      namespace: 'invoiceSchedules',
      initial: FilterType.all,
      shouldCloseOnClick: false
    }),
    {
      label: t('common.status'),
      type: FilterType.status,
      options: [
        { label: t('invoiceSchedules.status.paused'), value: InvoiceScheduleStatus.paused },
        { label: t('invoiceSchedules.status.completed'), value: InvoiceScheduleStatus.completed },
        { label: t('invoiceSchedules.status.failed'), value: InvoiceScheduleStatus.failed }
      ],
      shouldCloseOnClick: true
    }
  ];

  return (
    <CRUDPageRTK<InvoiceSchedule, InvoiceScheduleAdd, InvoiceScheduleUpdate>
      componentId="invoiceSchedules"
      title={t('invoiceSchedules.title')}
      useRetrieve={useGetInvoiceSchedulesQuery}
      useAdd={useAddInvoiceScheduleMutation}
      useUpdate={useUpdateInvoiceScheduleMutation}
      useDelete={useDeleteInvoiceScheduleMutation}
      filters={filters}
      showOnlyExport={true}
      exportExcelHandler={exportSchedules}
      searchField={schedule => {
        const invoice = invoices.find(item => item.id === schedule.sourceInvoiceId);
        return [
          invoice?.invoiceFullNumber,
          invoice?.invoiceNumber,
          invoice?.invoiceClientSnapshot?.clientName,
          schedule.status,
          schedule.cadence
        ]
          .filter(Boolean)
          .join(' ');
      }}
      sortOptions={[
        { label: t('invoiceSchedules.nextRun'), value: 'nextRunAt' },
        { label: t('common.lastUpdate'), value: 'updatedAt' }
      ]}
      noItemButtonText={t('invoiceSchedules.add')}
      noItemText={t('invoiceSchedules.noSchedules')}
      leftTitle={t('menuItems.invoiceSchedules')}
      validateAndNormalize={async data => {
        if (!isInvoiceScheduleData(data)) return;
        return data;
      }}
      renderListItem={(item, selectedItem, onEdit, onDelete) => (
        <List
          key={item.id}
          item={item}
          selectedItem={selectedItem}
          onEdit={(editItem: InvoiceSchedule) => onEdit(editItem)}
          onDelete={(id: number) => onDelete(id)}
        />
      )}
      form={({ item, onChange }) => (
        <Form
          item={item}
          handleChange={data => {
            if (isInvoiceScheduleData(data.schedule))
              onChange({
                changedData: data.schedule,
                isFormValid: data.isFormValid,
                description: data.description
              });
          }}
        />
      )}
    />
  );
};
