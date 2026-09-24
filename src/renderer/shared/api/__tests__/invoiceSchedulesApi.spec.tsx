import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { FilterType } from '../../enums/filterType';
import {
  InvoiceScheduleCadence,
  InvoiceScheduleDeliveryMethod,
  InvoiceScheduleStatus
} from '../../enums/invoiceSchedule';
import {
  invoiceSchedulesApi,
  useAddInvoiceScheduleMutation,
  useDeleteInvoiceScheduleMutation,
  useGetInvoiceScheduleRunsQuery,
  useGetInvoiceSchedulesQuery,
  useUpdateInvoiceScheduleMutation
} from '../invoiceSchedulesApi';
import { getApi } from '../restApi';
import { runApiTrigger } from './testUtils';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('invoiceSchedulesApi', () => {
  const mockApi = {
    getAllInvoiceSchedules: vi.fn(),
    getInvoiceScheduleRuns: vi.fn(),
    addInvoiceSchedule: vi.fn(),
    updateInvoiceSchedule: vi.fn(),
    deleteInvoiceSchedule: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(invoiceSchedulesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('retrieves schedule list and run history', async () => {
    const filter = [{ type: FilterType.active, value: '' }];
    mockApi.getAllInvoiceSchedules.mockResolvedValue({ success: true, data: [{ id: 1, sourceInvoiceId: 3 }] });
    mockApi.getInvoiceScheduleRuns.mockResolvedValue({ success: true, data: [{ id: 9, scheduleId: 1 }] });

    const schedules = renderHook(() => useGetInvoiceSchedulesQuery(filter), { wrapper });
    const runs = renderHook(() => useGetInvoiceScheduleRunsQuery(1), { wrapper });

    await waitFor(() => expect(schedules.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(runs.result.current.isSuccess).toBe(true));

    expect(mockApi.getAllInvoiceSchedules).toHaveBeenCalledWith(filter);
    expect(mockApi.getInvoiceScheduleRuns).toHaveBeenCalledWith(1);
    expect(schedules.result.current.data).toEqual([{ id: 1, sourceInvoiceId: 3 }]);
    expect(runs.result.current.data).toEqual([{ id: 9, scheduleId: 1 }]);
  });

  it('normalizes response and exception errors', async () => {
    mockApi.getAllInvoiceSchedules.mockResolvedValueOnce({ success: false, key: 'error.scheduleNotFound' });
    const responseError = renderHook(() => useGetInvoiceSchedulesQuery(), { wrapper });
    await waitFor(() => expect(responseError.result.current.isError).toBe(true));
    expect(responseError.result.current.error).toEqual({
      kind: 'response',
      message: undefined,
      key: 'error.scheduleNotFound'
    });

    responseError.unmount();
    store.dispatch(invoiceSchedulesApi.util.resetApiState());
    mockApi.getAllInvoiceSchedules.mockRejectedValueOnce(new Error('offline'));
    const exceptionError = renderHook(() => useGetInvoiceSchedulesQuery(), { wrapper });
    await waitFor(() => expect(exceptionError.result.current.isError).toBe(true));
    expect(exceptionError.result.current.error).toEqual({ kind: 'exception', message: 'offline' });
  });

  it('routes create, update, and delete mutations', async () => {
    const schedule = {
      sourceInvoiceId: 3,
      cadence: InvoiceScheduleCadence.monthly,
      intervalCount: 1,
      timezone: 'UTC',
      startAt: '2026-01-01T09:00:00.000Z',
      dueDateOffsetDays: 14,
      status: InvoiceScheduleStatus.active,
      deliveryMethod: InvoiceScheduleDeliveryMethod.none
    };
    mockApi.addInvoiceSchedule.mockResolvedValue({ success: true, data: { ...schedule, id: 1 } });
    mockApi.updateInvoiceSchedule.mockResolvedValue({ success: true, data: { id: 1, status: 'paused' } });
    mockApi.deleteInvoiceSchedule.mockResolvedValue({ success: true });

    const add = renderHook(() => useAddInvoiceScheduleMutation(), { wrapper });
    const update = renderHook(() => useUpdateInvoiceScheduleMutation(), { wrapper });
    const remove = renderHook(() => useDeleteInvoiceScheduleMutation(), { wrapper });

    await runApiTrigger(() => add.result.current[0](schedule));
    await runApiTrigger(() => update.result.current[0]({ id: 1, status: InvoiceScheduleStatus.paused }));
    await runApiTrigger(() => remove.result.current[0](1));

    expect(mockApi.addInvoiceSchedule).toHaveBeenCalledWith(schedule);
    expect(mockApi.updateInvoiceSchedule).toHaveBeenCalledWith({ id: 1, status: InvoiceScheduleStatus.paused });
    expect(mockApi.deleteInvoiceSchedule).toHaveBeenCalledWith(1);
  });
});
