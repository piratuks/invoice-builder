import { FilterType } from '../../enums/filterType';
import { SortType } from '../../enums/sortType';
import { createCommonFilters, createInvoiceFilters, filterAndSortArray } from '../filterSortFunctions';

const t = ((key: string) => key) as never;

describe('filterAndSortArray', () => {
  const data = [
    { name: 'Banana', qty: 2 },
    { name: 'apple', qty: 5 },
    { name: 'Cherry', qty: 1 }
  ];

  it('filters by a string search field', () => {
    const result = filterAndSortArray({ data, searchValue: 'an', searchField: 'name' });
    expect(result.map(r => r.name)).toEqual(['Banana']);
  });

  it('supports a function-based search field', () => {
    const result = filterAndSortArray({ data, searchValue: 'app', searchField: item => item.name });
    expect(result.map(r => r.name)).toEqual(['apple']);
  });

  it('returns all data when searchValue is empty', () => {
    const result = filterAndSortArray({ data, searchValue: '', searchField: 'name' });
    expect(result).toHaveLength(3);
  });

  it('sorts strings ascending and descending', () => {
    const asc = filterAndSortArray({
      data,
      searchValue: '',
      searchField: 'name',
      sortField: 'name',
      sortType: SortType.ASC
    });
    expect(asc.map(r => r.name)).toEqual(['apple', 'Banana', 'Cherry']);

    const desc = filterAndSortArray({
      data,
      searchValue: '',
      searchField: 'name',
      sortField: 'name',
      sortType: SortType.DESC
    });
    expect(desc.map(r => r.name)).toEqual(['Cherry', 'Banana', 'apple']);
  });

  it('sorts numbers ascending and descending', () => {
    const asc = filterAndSortArray({
      data,
      searchValue: '',
      searchField: 'name',
      sortField: 'qty',
      sortType: SortType.ASC
    });
    expect(asc.map(r => r.qty)).toEqual([1, 2, 5]);

    const desc = filterAndSortArray({
      data,
      searchValue: '',
      searchField: 'name',
      sortField: 'qty',
      sortType: SortType.DESC
    });
    expect(desc.map(r => r.qty)).toEqual([5, 2, 1]);
  });

  it('supports a function-based sort field', () => {
    const result = filterAndSortArray({
      data,
      searchValue: '',
      searchField: 'name',
      sortField: item => item.qty,
      sortType: SortType.ASC
    });
    expect(result.map(r => r.qty)).toEqual([1, 2, 5]);
  });

  it('leaves order unchanged for SortType.DEFAULT', () => {
    const result = filterAndSortArray({ data, searchValue: '', searchField: 'name', sortField: 'name' });
    expect(result).toEqual(data);
  });
});

describe('createCommonFilters', () => {
  it('builds all/active/archived filters with the initial one flagged', () => {
    const filters = createCommonFilters({ t, namespace: 'clients', initial: FilterType.active });
    expect(filters).toHaveLength(3);
    expect(filters.map(f => f.type)).toEqual([FilterType.all, FilterType.active, FilterType.archived]);
    expect(filters.find(f => f.type === FilterType.active)?.initial).toBe(true);
    expect(filters.find(f => f.type === FilterType.all)?.description).toBeUndefined();
  });

  it('respects shouldCloseOnClick', () => {
    const filters = createCommonFilters({
      t,
      namespace: 'clients',
      initial: FilterType.all,
      shouldCloseOnClick: false
    });
    expect(filters.every(f => f.shouldCloseOnClick === false)).toBe(true);
  });
});

describe('createInvoiceFilters', () => {
  it('builds invoice-related filters', () => {
    const filters = createInvoiceFilters({ t, namespace: 'invoices', initial: FilterType.all });
    expect(filters.map(f => f.type)).toEqual([
      FilterType.atleastOneInvoice,
      FilterType.noInvoices,
      FilterType.noInvoices30,
      FilterType.noInvoices60,
      FilterType.noInvoices90
    ]);
    expect(filters.every(f => f.shouldCloseOnClick === true)).toBe(true);
  });
});
