import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../../i18n';
import { FilterType } from '../../../../enums/filterType';
import type { Filter } from '../../../../types/filter';
import { BottomFilterSheet } from '../BottomFilterSheet';

vi.mock('../../../../../state/configureStore', () => ({
  useAppSelector: () => ({ dateFormat: 'yyyy-MM-dd' })
}));

vi.mock('../../../inputs/utcDateRangePicker/UTCDateRangePicker', () => ({
  UTCDateRangePicker: ({
    valueFrom,
    valueTo,
    onChange
  }: {
    valueFrom?: string;
    valueTo?: string;
    onChange: (from?: string, to?: string) => void;
  }) => (
    <div>
      <span>{`${valueFrom ?? 'empty'}:${valueTo ?? 'empty'}`}</span>
      <button onClick={() => onChange('2026-01-01', '2026-01-31')}>set-date</button>
      <button onClick={() => onChange(undefined, undefined)}>clear-date</button>
    </div>
  )
}));

const renderSheet = (filters: Filter[], selectedFilter: Filter[], onFilter = vi.fn()) => {
  const view = render(
    <I18nextProvider i18n={i18n}>
      <BottomFilterSheet filters={filters} selectedFilter={selectedFilter} onFilter={onFilter} />
    </I18nextProvider>
  );

  return { ...view, onFilter };
};

describe('BottomFilterSheet', () => {
  beforeAll(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  it('selects a grouped filter and closes the sheet when configured', async () => {
    const user = userEvent.setup();
    const filters: Filter[] = [
      { type: FilterType.all, value: FilterType.all, label: 'All', isGroup: true },
      {
        type: FilterType.archived,
        value: FilterType.archived,
        label: 'Archived',
        description: 'Archived records',
        isGroup: true,
        shouldCloseOnClick: true
      }
    ];
    const { onFilter } = renderSheet(filters, [filters[0]]);

    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.filters') }));
    expect(screen.getByText(i18n.t('common.selectFilterType'))).toBeVisible();

    await user.click(screen.getByRole('radio', { name: /Archived/ }));

    expect(onFilter).toHaveBeenCalledWith([filters[1]]);
    await waitFor(() => expect(screen.getByRole('dialog', { hidden: true })).toHaveStyle({ visibility: 'hidden' }));
  });

  it('changes and removes a status filter through its chips', async () => {
    const user = userEvent.setup();
    const status: Filter = {
      type: FilterType.status,
      value: 'draft',
      label: 'Status',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Paid', value: 'paid' }
      ]
    };
    const { onFilter } = renderSheet([status], [{ ...status }]);

    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.filters') }));
    await user.click(screen.getByText('Paid'));
    expect(onFilter).toHaveBeenLastCalledWith([expect.objectContaining({ type: FilterType.status, value: 'paid' })]);

    await user.click(screen.getByText('Paid'));
    expect(onFilter).toHaveBeenLastCalledWith([]);
  });

  it('selects an autocomplete option and sets or clears a date range', async () => {
    const user = userEvent.setup();
    const business: Filter = {
      type: FilterType.business,
      label: 'Business',
      options: [{ label: 'Acme Ltd', value: '7' }]
    };
    const date: Filter = { type: FilterType.date, label: 'Date' };
    const { onFilter, rerender } = renderSheet([business, date], []);

    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.filters') }));
    const combobox = screen.getByRole('combobox', { name: 'Business' });
    await user.click(combobox);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onFilter).toHaveBeenCalledWith([expect.objectContaining({ type: FilterType.business, value: '7' })]);

    await user.click(screen.getByText('set-date'));
    expect(onFilter).toHaveBeenLastCalledWith([
      expect.objectContaining({ type: FilterType.date, value: '2026-01-01,2026-01-31' })
    ]);

    rerender(
      <I18nextProvider i18n={i18n}>
        <BottomFilterSheet
          filters={[date]}
          selectedFilter={[{ ...date, value: '2026-01-01,2026-01-31' }]}
          onFilter={onFilter}
        />
      </I18nextProvider>
    );
    await user.click(screen.getByText('clear-date'));
    expect(onFilter).toHaveBeenLastCalledWith([]);
  });
});
