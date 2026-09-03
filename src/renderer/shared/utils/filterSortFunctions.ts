import { FilterType } from '../enums/filterType';
import { SortType } from '../enums/sortType';
import type { Filter, FilterConfig } from '../types/filter';

export const filterAndSortArray = <T>(params: {
  data: T[];
  searchValue: string;
  searchField: keyof T | ((item: T) => string | undefined);
  sortField?: keyof T | ((item: T) => string | number | undefined);
  sortType?: SortType;
}): T[] => {
  const { data, searchValue, searchField, sortField, sortType = SortType.DEFAULT } = params;

  let result = data;
  if (searchValue) {
    const lowerSearch = searchValue.toLowerCase();
    result = result.filter(item => {
      const value = typeof searchField === 'function' ? searchField(item) : item[searchField];
      return typeof value === 'string' && value.toLowerCase().includes(lowerSearch);
    });
  }

  if ((sortType === SortType.ASC || sortType === SortType.DESC) && sortField) {
    result = [...result].sort((a, b) => {
      const aVal = typeof sortField === 'function' ? sortField(a) : a[sortField];
      const bVal = typeof sortField === 'function' ? sortField(b) : b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortType === SortType.ASC ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortType === SortType.ASC ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }

  return result;
};

export const createCommonFilters = ({ t, namespace, initial, shouldCloseOnClick = true }: FilterConfig): Filter[] => {
  const commonTypes: { key: string; type: FilterType }[] = [
    { key: 'allText', type: FilterType.all },
    { key: 'activeText', type: FilterType.active },
    { key: 'archivedText', type: FilterType.archived }
  ];

  return commonTypes.map(({ key, type }) => ({
    label: t(`${namespace}.filter.${key}`),
    description: key === 'allText' ? undefined : t(`${namespace}.filter.${key.replace('Text', 'Desc')}`),
    value: type,
    type,
    isGroup: true,
    shouldCloseOnClick,
    ...(type === initial ? { initial: true } : {})
  }));
};

export const createInvoiceFilters = ({ t, namespace }: FilterConfig): Filter[] => {
  const invoiceTypes: { key: string; type: FilterType }[] = [
    { key: 'atleastOneInvoiceText', type: FilterType.atleastOneInvoice },
    { key: 'noInvoicesText', type: FilterType.noInvoices },
    { key: 'noInvoices30Text', type: FilterType.noInvoices30 },
    { key: 'noInvoices60Text', type: FilterType.noInvoices60 },
    { key: 'noInvoices90Text', type: FilterType.noInvoices90 }
  ];
  return invoiceTypes.map(({ key, type }) => ({
    label: t(`${namespace}.filter.${key}`),
    description: t(`${namespace}.filter.${key.replace('Text', 'Desc')}`),
    value: type,
    type,
    isGroup: true,
    shouldCloseOnClick: true
  }));
};
