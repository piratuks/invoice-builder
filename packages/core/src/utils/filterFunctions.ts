import type { DatabaseType, FilterData } from '@invoice-builder/contracts';
import { FilterType } from '@invoice-builder/contracts';
import { getDefaultValue } from './dbHelper';

export const getWhereClauseFromFilters = (data: {
  filters: FilterData[];
  archivedColumn?: string;
  clientNameSnapshotColumn?: string;
  businessNameSnapshotColumn?: string;
  issuedAtColumn?: string;
  statusColumn?: string;
}): string => {
  const {
    filters,
    archivedColumn,
    clientNameSnapshotColumn,
    businessNameSnapshotColumn,
    issuedAtColumn,
    statusColumn
  } = data;

  const clauses: string[] = [];

  filters.forEach(({ type, value }) => {
    switch (type) {
      case FilterType.active:
        if (archivedColumn) clauses.push(`${archivedColumn} = 0`);
        break;
      case FilterType.archived:
        if (archivedColumn) clauses.push(`${archivedColumn} = 1`);
        break;
      case FilterType.client:
        if (clientNameSnapshotColumn && value)
          clauses.push(`${clientNameSnapshotColumn} = '${value.replace(/'/g, "''")}'`);
        break;
      case FilterType.business:
        if (businessNameSnapshotColumn && value)
          clauses.push(`${businessNameSnapshotColumn} = '${value.replace(/'/g, "''")}'`);
        break;
      case FilterType.date:
        if (issuedAtColumn && value) {
          const dates = value.split(',');
          if (dates.length === 2) clauses.push(`${issuedAtColumn} BETWEEN '${dates[0]}' AND '${dates[1]}'`);
        }
        break;
      case FilterType.status:
        if (statusColumn && value) clauses.push(`${statusColumn} = '${value.replace(/'/g, "''")}'`);
        break;
      case FilterType.all:
      default:
        break;
    }
  });

  return clauses.length ? clauses.join(' AND ') : '1=1';
};

export const getHavingClauseFromFilters = (data: {
  dbType: DatabaseType;
  filters: FilterData[];
  invoiceUpdatedAtColumn?: string;
  invoiceIdColumn?: string;
  archivedColumn?: string;
  clientNameSnapshotColumn?: string;
  businessNameSnapshotColumn?: string;
  issuedAtColumn?: string;
  statusColumn?: string;
}): string => {
  const {
    filters,
    dbType,
    invoiceUpdatedAtColumn,
    issuedAtColumn,
    invoiceIdColumn,
    archivedColumn,
    businessNameSnapshotColumn,
    clientNameSnapshotColumn,
    statusColumn
  } = data;

  if (!filters?.length) return '';

  const clauses: string[] = [];

  filters.forEach(({ type, value }) => {
    switch (type) {
      case FilterType.noInvoices30:
        if (invoiceUpdatedAtColumn)
          clauses.push(
            `(MAX(${invoiceUpdatedAtColumn}) IS NULL OR MAX(${invoiceUpdatedAtColumn}) < ${getDefaultValue("datetime('now', '-30 days')", dbType)})`
          );
        break;
      case FilterType.noInvoices60:
        if (invoiceUpdatedAtColumn)
          clauses.push(
            `(MAX(${invoiceUpdatedAtColumn}) IS NULL OR MAX(${invoiceUpdatedAtColumn}) < ${getDefaultValue("datetime('now', '-60 days')", dbType)})`
          );
        break;
      case FilterType.noInvoices90:
        if (invoiceUpdatedAtColumn)
          clauses.push(
            `(MAX(${invoiceUpdatedAtColumn}) IS NULL OR MAX(${invoiceUpdatedAtColumn}) < ${getDefaultValue("datetime('now', '-90 days')", dbType)})`
          );
        break;
      case FilterType.noInvoices:
        if (invoiceIdColumn) clauses.push(`(COUNT(${invoiceIdColumn}) = 0)`);
        break;
      case FilterType.atleastOneInvoice:
        if (invoiceIdColumn) clauses.push(`(COUNT(${invoiceIdColumn}) > 0)`);
        break;
      case FilterType.active:
        if (archivedColumn) clauses.push(`(${archivedColumn} = 0)`);
        break;
      case FilterType.archived:
        if (archivedColumn) clauses.push(`(${archivedColumn} = 1)`);
        break;
      case FilterType.client:
        if (clientNameSnapshotColumn && value)
          clauses.push(`${clientNameSnapshotColumn} = '${value.replace(/'/g, "''")}'`);
        break;
      case FilterType.business:
        if (businessNameSnapshotColumn && value)
          clauses.push(`${businessNameSnapshotColumn} = '${value.replace(/'/g, "''")}'`);
        break;
      case FilterType.date:
        const dates = value?.split(',') ?? [];
        if (dates.length === 2 && issuedAtColumn) {
          clauses.push(`${issuedAtColumn} BETWEEN '${dates[0]}' AND '${dates[1]}'`);
        }
        break;
      case FilterType.status:
        if (statusColumn && value) clauses.push(`${statusColumn} = '${value.replace(/'/g, "''")}'`);
        break;
      case FilterType.all:
      default:
        break;
    }
  });

  if (!clauses.length) return '';

  return `HAVING ${clauses.join(' AND ')}`;
};
