import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { SortType } from '../../../enums/sortType';
import { FilterSortBar } from '../filterSortBar/FilterSortBar';
import { ImportExportButton } from '../importExportButton/ImportExportButton';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('FilterSortBar', () => {
  const options = [
    { label: 'Name', value: 'name' },
    { label: 'Created', value: 'created' }
  ];

  it('changes the sort field and advances each sort direction', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <FilterSortBar
        activeSort={SortType.DEFAULT}
        activeSortBy={options[0]}
        sortByOptions={options}
        onChange={onChange}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Created' }));
    expect(onChange).toHaveBeenLastCalledWith({ sort: SortType.DEFAULT, sortBy: options[1] });

    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.noSort') }));
    expect(onChange).toHaveBeenLastCalledWith({ sort: SortType.DESC, sortBy: options[0] });

    rerender(
      <FilterSortBar activeSort={SortType.DESC} activeSortBy={options[0]} sortByOptions={options} onChange={onChange} />
    );
    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.ascending') }));
    expect(onChange).toHaveBeenLastCalledWith({ sort: SortType.ASC, sortBy: options[0] });

    rerender(
      <FilterSortBar activeSort={SortType.ASC} activeSortBy={options[0]} sortByOptions={options} onChange={onChange} />
    );
    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.ascending') }));
    expect(onChange).toHaveBeenLastCalledWith({ sort: SortType.DEFAULT, sortBy: options[0] });
  });
});

describe('ImportExportButton', () => {
  it('runs import, export, and template callbacks from the menu', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue(undefined);
    const onExport = vi.fn();
    const onDownloadTemplate = vi.fn();
    const { container } = render(
      <ImportExportButton
        showOnlyExport={false}
        onImport={onImport}
        onExport={onExport}
        onDownloadTemplate={onDownloadTemplate}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: i18n.t('common.importExport') }));
    await user.click(screen.getByText(i18n.t('common.export')));
    expect(onExport).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: i18n.t('common.importExport') }));
    await user.click(screen.getByText(i18n.t('common.downloadTemplate')));
    expect(onDownloadTemplate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: i18n.t('common.importExport') }));
    await user.click(screen.getByText(i18n.t('common.import')));
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    const file = new File(['rows'], 'rows.xlsx');
    await user.upload(fileInput as HTMLInputElement, file);
    expect(onImport).toHaveBeenCalledWith(file);
  });

  it('exports immediately in export-only mode', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<ImportExportButton showOnlyExport onExport={onExport} />, { wrapper });

    await user.click(screen.getByRole('button', { name: i18n.t('common.export') }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
