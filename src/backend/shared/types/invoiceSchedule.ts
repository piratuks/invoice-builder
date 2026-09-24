import type {
  InvoiceScheduleCadence,
  InvoiceScheduleDeliveryMethod,
  InvoiceScheduleDeliveryStatus,
  InvoiceScheduleRunStatus,
  InvoiceScheduleStatus
} from '../enums/invoiceSchedule';

export interface InvoiceSchedule {
  id?: number;
  sourceInvoiceId: number;
  cadence: InvoiceScheduleCadence;
  intervalCount: number;
  timezone: string;
  startAt: string;
  endAt?: string;
  maxOccurrences?: number;
  nextRunAt: string;
  lastRunAt?: string;
  dueDateOffsetDays: number;
  status: InvoiceScheduleStatus;
  isArchived: boolean;
  deliveryMethod: InvoiceScheduleDeliveryMethod;
  failureReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type InvoiceScheduleAdd = Omit<
  InvoiceSchedule,
  'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'lastRunAt' | 'nextRunAt'
> & {
  isArchived?: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
};

export type InvoiceScheduleUpdate = Partial<InvoiceScheduleAdd> & { id: number };

export interface InvoiceScheduleRun {
  id?: number;
  scheduleId: number;
  dueAt: string;
  idempotencyKey: string;
  startedAt?: string;
  completedAt?: string;
  generatedInvoiceId?: number;
  status: InvoiceScheduleRunStatus;
  deliveryStatus: InvoiceScheduleDeliveryStatus;
  deliveryError?: string;
  errorMessage?: string;
  deliveryAttemptId?: number;
  deliveryAttemptedAt?: string;
  deliveryRecipient?: string;
  deliveryProvider?: string;
  deliveryAttemptError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceScheduleDeliveryAttempt {
  id?: number;
  scheduleRunId: number;
  scheduleId: number;
  generatedInvoiceId?: number;
  provider: string;
  recipient?: string;
  status: InvoiceScheduleDeliveryStatus;
  errorMessage?: string;
  attemptedAt: string;
  createdAt?: string;
  updatedAt?: string;
}
