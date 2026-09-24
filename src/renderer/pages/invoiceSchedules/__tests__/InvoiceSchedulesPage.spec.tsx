import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { InvoiceScheduleStatus } from '../../../shared/enums/invoiceSchedule';
import { InvoiceSchedulesPage } from '../index';

const scheduleApiMocks = vi.hoisted(() => ({
  addSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  schedules: [
    {
      id: 11,
      sourceInvoiceId: 7,
      cadence: 'monthly',
      intervalCount: 1,
      timezone: 'UTC',
      startAt: '2026-01-01T09:00:00.000Z',
      nextRunAt: '2026-02-01T09:00:00.000Z',
      lastRunAt: '2026-01-01T09:00:00.000Z',
      dueDateOffsetDays: 14,
      status: 'active',
      isArchived: false,
      deliveryMethod: 'none'
    }
  ],
  runs: [
    {
      id: 21,
      scheduleId: 11,
      dueAt: '2026-01-01T09:00:00.000Z',
      idempotencyKey: 'invoice-schedule:11:2026-01-01T09:00:00.000Z',
      generatedInvoiceId: 15,
      status: 'success',
      deliveryStatus: 'not_applicable'
    }
  ]
}));

const invoiceApiMocks = vi.hoisted(() => ({
  invoices: [
    {
      id: 7,
      invoiceType: 'invoice',
      invoiceNumber: '1',
      invoiceFullNumber: 'INV-1',
      invoiceClientSnapshot: { clientName: 'Acme' }
    },
    {
      id: 15,
      invoiceType: 'invoice',
      invoiceNumber: '2',
      invoiceFullNumber: 'INV-2'
    }
  ]
}));

vi.mock('../../../shared/api/invoiceSchedulesApi', () => ({
  useGetInvoiceSchedulesQuery: () => ({
    data: scheduleApiMocks.schedules,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn()
  }),
  useGetInvoiceScheduleRunsQuery: () => ({ data: scheduleApiMocks.runs, isFetching: false }),
  useAddInvoiceScheduleMutation: () => [scheduleApiMocks.addSchedule, { isLoading: false }],
  useUpdateInvoiceScheduleMutation: () => [scheduleApiMocks.updateSchedule, { isLoading: false }],
  useDeleteInvoiceScheduleMutation: () => [scheduleApiMocks.deleteSchedule, { isLoading: false }]
}));

vi.mock('../../../shared/api/invoicesApi', () => ({
  useGetInvoicesQuery: () => ({ data: invoiceApiMocks.invoices })
}));

vi.mock('../../../state/configureStore', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: () => ({ dateFormat: 'MM/dd/yyyy', quotesON: true })
}));

const withProviders = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/invoice-schedules']}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </MemoryRouter>
);

describe('InvoiceSchedulesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scheduleApiMocks.updateSchedule.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    scheduleApiMocks.deleteSchedule.mockResolvedValue({ data: undefined });
    scheduleApiMocks.addSchedule.mockResolvedValue({ data: {} });
  });

  it('uses the CRUD shell and exposes form-level history and status actions', async () => {
    render(<InvoiceSchedulesPage />, { wrapper: withProviders });

    expect(screen.getByText('Recurring invoices')).toBeInTheDocument();
    expect(screen.getByText('INV-1 - Acme')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();

    fireEvent.click(screen.getByText('INV-1 - Acme'));

    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(scheduleApiMocks.updateSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ id: 11, status: InvoiceScheduleStatus.paused })
    );
    await waitFor(() => expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(await screen.findByText('Run history')).toBeInTheDocument();
    expect(screen.getByText('INV-2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    fireEvent.click(screen.getByLabelText('Archived'));
    fireEvent.click(await screen.findByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(scheduleApiMocks.updateSchedule).toHaveBeenCalledWith(
        expect.objectContaining({ id: 11, isArchived: true, status: InvoiceScheduleStatus.paused })
      )
    );
  });

  it('opens the create form with generate-only delivery selected', () => {
    render(<InvoiceSchedulesPage />, { wrapper: withProviders });

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Source invoice')).toBeInTheDocument();
    expect(screen.getByText('Generate invoice only')).toBeInTheDocument();
  });
});
