import { DatabaseType } from '../shared/enums/databaseType';
import { FilterType } from '../shared/enums/filterType';
import { getHavingClauseFromFilters, getWhereClauseFromFilters } from '../shared/utils/filterFunctions';

describe('getWhereClauseFromFilters', () => {
  it('returns 1=1 when there are no filters', () => {
    expect(getWhereClauseFromFilters({ filters: [] })).toBe('1=1');
  });

  it('builds an active clause', () => {
    const result = getWhereClauseFromFilters({
      filters: [{ type: FilterType.active, value: '' }],
      archivedColumn: 't."isArchived"'
    });
    expect(result).toBe('t."isArchived" = 0');
  });

  it('builds an archived clause', () => {
    const result = getWhereClauseFromFilters({
      filters: [{ type: FilterType.archived, value: '' }],
      archivedColumn: 't."isArchived"'
    });
    expect(result).toBe('t."isArchived" = 1');
  });

  it('escapes single quotes for client filter', () => {
    const result = getWhereClauseFromFilters({
      filters: [{ type: FilterType.client, value: "O'Brien" }],
      clientNameSnapshotColumn: 'i."clientNameSnapshot"'
    });
    expect(result).toBe(`i."clientNameSnapshot" = 'O''Brien'`);
  });

  it('builds a business clause', () => {
    const result = getWhereClauseFromFilters({
      filters: [{ type: FilterType.business, value: 'Acme' }],
      businessNameSnapshotColumn: 'i."businessNameSnapshot"'
    });
    expect(result).toBe(`i."businessNameSnapshot" = 'Acme'`);
  });

  it('builds a date range clause', () => {
    const result = getWhereClauseFromFilters({
      filters: [{ type: FilterType.date, value: '2024-01-01,2024-01-31' }],
      issuedAtColumn: 'i."issuedAt"'
    });
    expect(result).toBe(`i."issuedAt" BETWEEN '2024-01-01' AND '2024-01-31'`);
  });

  it('ignores a malformed date range', () => {
    const result = getWhereClauseFromFilters({
      filters: [{ type: FilterType.date, value: '2024-01-01' }],
      issuedAtColumn: 'i."issuedAt"'
    });
    expect(result).toBe('1=1');
  });

  it('builds a status clause', () => {
    const result = getWhereClauseFromFilters({
      filters: [{ type: FilterType.status, value: 'paid' }],
      statusColumn: 'i."status"'
    });
    expect(result).toBe(`i."status" = 'paid'`);
  });

  it('ignores the all filter and combines multiple clauses', () => {
    const result = getWhereClauseFromFilters({
      filters: [
        { type: FilterType.all, value: '' },
        { type: FilterType.active, value: '' },
        { type: FilterType.status, value: 'paid' }
      ],
      archivedColumn: 't."isArchived"',
      statusColumn: 'i."status"'
    });
    expect(result).toBe(`t."isArchived" = 0 AND i."status" = 'paid'`);
  });
});

describe('getHavingClauseFromFilters', () => {
  const base = { dbType: DatabaseType.sqlite };

  it('returns empty string when there are no filters', () => {
    expect(getHavingClauseFromFilters({ ...base, filters: [] })).toBe('');
  });

  it('builds noInvoices30/60/90 clauses', () => {
    for (const type of [FilterType.noInvoices30, FilterType.noInvoices60, FilterType.noInvoices90]) {
      const result = getHavingClauseFromFilters({
        ...base,
        filters: [{ type, value: '' }],
        invoiceUpdatedAtColumn: 'i."updatedAt"'
      });
      expect(result).toContain('HAVING');
      expect(result).toContain('MAX(i."updatedAt")');
    }
  });

  it('builds noInvoices and atleastOneInvoice clauses', () => {
    expect(
      getHavingClauseFromFilters({
        ...base,
        filters: [{ type: FilterType.noInvoices, value: '' }],
        invoiceIdColumn: 'i."id"'
      })
    ).toBe('HAVING (COUNT(i."id") = 0)');

    expect(
      getHavingClauseFromFilters({
        ...base,
        filters: [{ type: FilterType.atleastOneInvoice, value: '' }],
        invoiceIdColumn: 'i."id"'
      })
    ).toBe('HAVING (COUNT(i."id") > 0)');
  });

  it('builds active/archived clauses', () => {
    expect(
      getHavingClauseFromFilters({
        ...base,
        filters: [{ type: FilterType.active, value: '' }],
        archivedColumn: 't."isArchived"'
      })
    ).toBe('HAVING (t."isArchived" = 0)');

    expect(
      getHavingClauseFromFilters({
        ...base,
        filters: [{ type: FilterType.archived, value: '' }],
        archivedColumn: 't."isArchived"'
      })
    ).toBe('HAVING (t."isArchived" = 1)');
  });

  it('builds client/business/date/status clauses', () => {
    expect(
      getHavingClauseFromFilters({
        ...base,
        filters: [{ type: FilterType.client, value: "O'Brien" }],
        clientNameSnapshotColumn: 'i."clientNameSnapshot"'
      })
    ).toBe(`HAVING i."clientNameSnapshot" = 'O''Brien'`);

    expect(
      getHavingClauseFromFilters({
        ...base,
        filters: [{ type: FilterType.business, value: 'Acme' }],
        businessNameSnapshotColumn: 'i."businessNameSnapshot"'
      })
    ).toBe(`HAVING i."businessNameSnapshot" = 'Acme'`);

    expect(
      getHavingClauseFromFilters({
        ...base,
        filters: [{ type: FilterType.date, value: '2024-01-01,2024-01-31' }],
        issuedAtColumn: 'i."issuedAt"'
      })
    ).toBe(`HAVING i."issuedAt" BETWEEN '2024-01-01' AND '2024-01-31'`);

    expect(
      getHavingClauseFromFilters({
        ...base,
        filters: [{ type: FilterType.status, value: 'paid' }],
        statusColumn: 'i."status"'
      })
    ).toBe(`HAVING i."status" = 'paid'`);
  });

  it('ignores the all filter', () => {
    expect(getHavingClauseFromFilters({ ...base, filters: [{ type: FilterType.all, value: '' }] })).toBe('');
  });
});
