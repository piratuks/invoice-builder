export enum InvoiceScheduleCadence {
  weekly = 'weekly',
  monthly = 'monthly',
  quarterly = 'quarterly',
  yearly = 'yearly'
}

export enum InvoiceScheduleStatus {
  active = 'active',
  paused = 'paused',
  completed = 'completed',
  failed = 'failed'
}

export enum InvoiceScheduleDeliveryMethod {
  none = 'none',
  email = 'email'
}

export enum InvoiceScheduleRunStatus {
  pending = 'pending',
  running = 'running',
  success = 'success',
  failed = 'failed',
  skipped = 'skipped'
}

export enum InvoiceScheduleDeliveryStatus {
  notApplicable = 'not_applicable',
  pending = 'pending',
  sent = 'sent',
  failed = 'failed'
}
