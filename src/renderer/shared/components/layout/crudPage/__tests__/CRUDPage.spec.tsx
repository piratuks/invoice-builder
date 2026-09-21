import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../../../i18n';
import { store } from '../../../../../state/configureStore';
import { FilterType } from '../../../../enums/filterType';
import type { Response } from '../../../../types/response';
import { importExcel } from '../../../../utils/fileFunctions';
import { CRUDPage } from '../CRUDPage';

vi.mock('../../../../utils/fileFunctions', () => ({
  exportExcel: vi.fn(),
  importExcel: vi.fn()
}));

// Force MUI's useMediaQuery to report a desktop viewport so both columns render.
let isDesktop = true;

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    (() => ({
      matches: true,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }));
  vi.spyOn(window, 'matchMedia').mockImplementation(
    query =>
      ({
        matches: isDesktop,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      }) as unknown as MediaQueryList
  );
});

interface Entity {
  id: number;
  name: string;
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/entities']}>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

const sortOptions = [{ label: 'Name', value: 'name' as keyof Entity }];

const makeItems = (count: number): Entity[] =>
  Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

const renderForm = ({
  item,
  onChange
}: {
  item?: Entity;
  onChange: (data: { changedData: Entity; isFormValid: boolean; description?: string }) => void;
}) => (
  <div>
    <input
      aria-label="name-input"
      defaultValue={item?.name ?? ''}
      onChange={e =>
        onChange({
          changedData: { id: item?.id, name: e.target.value } as Entity,
          isFormValid: true,
          description: undefined
        })
      }
    />
  </div>
);

const baseProps = {
  componentId: 'entities-test',
  searchField: 'name' as const,
  sortOptions,
  noItemText: 'No entities yet',
  noItemButtonText: 'Add entity',
  validateAndNormalize: async (data: unknown) => data as Entity,
  form: renderForm
};

describe('CRUDPage', () => {
  beforeEach(() => {
    localStorage.clear();
    isDesktop = true;
    vi.clearAllMocks();
  });

  it('shows the empty state and add button when there are no items', () => {
    render(<CRUDPage {...baseProps} useRetrieve={() => ({ items: [], execute: vi.fn() })} />, { wrapper });

    expect(screen.getByText('No entities yet')).toBeInTheDocument();
    expect(screen.getByText('Add entity')).toBeInTheDocument();
  });

  it('renders a list item for each retrieved entity', () => {
    const items = makeItems(3);
    render(
      <CRUDPage
        {...baseProps}
        useRetrieve={() => ({ items, execute: vi.fn() })}
        renderListItem={item => <div key={item.id}>{item.name}</div>}
      />,
      { wrapper }
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('filters the list using the search input', async () => {
    const user = userEvent.setup();
    const items = makeItems(3);
    render(
      <CRUDPage
        {...baseProps}
        useRetrieve={() => ({ items, execute: vi.fn() })}
        renderListItem={item => <div key={item.id}>{item.name}</div>}
      />,
      { wrapper }
    );

    const searchBox = screen.getByRole('textbox', { name: /search/i });
    await user.type(searchBox, 'Item 2');

    await waitFor(() => {
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  it('paginates when there are more items than itemsPerPage', () => {
    const items = makeItems(5);
    render(
      <CRUDPage
        {...baseProps}
        itemsPerPage={2}
        useRetrieve={() => ({ items, execute: vi.fn() })}
        renderListItem={item => <div key={item.id}>{item.name}</div>}
      />,
      { wrapper }
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.queryByText('Item 3')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('opens the add form when the add button is clicked and saves a new item', async () => {
    const user = userEvent.setup();
    const addExecute = vi.fn();
    render(
      <CRUDPage
        {...baseProps}
        useRetrieve={() => ({ items: [], execute: vi.fn() })}
        useAdd={({ onDone }) => ({
          data: undefined,
          execute: () => {
            addExecute();
            onDone?.({ success: true, data: { id: 1, name: 'New item' } } as Response<Entity>);
          }
        })}
      />,
      { wrapper }
    );

    await user.click(screen.getByText('Add entity'));
    const input = await screen.findByLabelText('name-input');
    await user.type(input, 'New item');

    const saveButton = screen.getByRole('button', { name: /save|common\.save/i });
    await user.click(saveButton);

    await waitFor(() => expect(addExecute).toHaveBeenCalled());
  });

  it('deletes an item after confirming the delete dialog', async () => {
    const user = userEvent.setup();
    const deleteExecute = vi.fn();
    const items = makeItems(1);

    render(
      <CRUDPage
        {...baseProps}
        useRetrieve={() => ({ items, execute: vi.fn() })}
        useDelete={() => ({ execute: deleteExecute })}
        renderListItem={(item, _selected, _onEdit, onDelete) => (
          <div key={item.id}>
            {item.name}
            <button onClick={() => onDelete(item.id)}>delete-{item.id}</button>
          </div>
        )}
      />,
      { wrapper }
    );

    await user.click(screen.getByText('delete-1'));

    const dialog = await screen.findByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: /delete|common\.delete|confirm/i });
    await user.click(confirmButton);

    await waitFor(() => expect(deleteExecute).toHaveBeenCalled());
  });

  it('duplicates an item via the injected useDuplicate hook', async () => {
    const user = userEvent.setup();
    const duplicateExecute = vi.fn();
    const items = makeItems(1);

    render(
      <CRUDPage
        {...baseProps}
        useRetrieve={() => ({ items, execute: vi.fn() })}
        useDuplicate={() => ({ data: undefined, execute: duplicateExecute })}
        renderListItem={(item, _selected, onEdit) => (
          <div key={item.id}>
            <button onClick={() => onEdit(item)}>edit-{item.id}</button>
          </div>
        )}
        form={({ item, onDuplicate }) => (
          <div>
            <span>{item?.name}</span>
            <button onClick={() => onDuplicate?.(item!.id)}>duplicate-{item?.id}</button>
          </div>
        )}
      />,
      { wrapper }
    );

    await user.click(screen.getByText('edit-1'));
    const duplicateButton = await screen.findByText('duplicate-1');
    await user.click(duplicateButton);

    await waitFor(() => expect(duplicateExecute).toHaveBeenCalled());
  });

  it('removes an active filter chip and falls back to the "all" filter', async () => {
    const user = userEvent.setup();
    const activeFilter = { type: FilterType.active, value: FilterType.active, label: 'Active', initial: true };
    const allFilter = { type: FilterType.all, value: FilterType.all, label: 'All', isGroup: true };

    render(
      <CRUDPage
        {...baseProps}
        componentId="entities-filter-test"
        filters={[allFilter, activeFilter]}
        useRetrieve={() => ({ items: makeItems(1), execute: vi.fn() })}
      />,
      { wrapper }
    );

    const chip = await screen.findByText('Active');
    const deleteIcon = chip.parentElement?.querySelector('svg');
    expect(deleteIcon).toBeTruthy();
    if (deleteIcon) {
      await user.click(deleteIcon);
    }

    await waitFor(() => expect(screen.queryByText('Active')).not.toBeInTheDocument());
  });

  it('exports items to excel via the custom export handler', async () => {
    const user = userEvent.setup();
    const exportExcelHandler = vi.fn().mockResolvedValue(undefined);
    const items = makeItems(2);

    render(
      <CRUDPage
        {...baseProps}
        exportExcelHandler={exportExcelHandler}
        showOnlyExport
        useRetrieve={() => ({ items, execute: vi.fn() })}
      />,
      { wrapper }
    );

    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    await waitFor(() => expect(exportExcelHandler).toHaveBeenCalledWith(items));
  });

  it('dispatches an error toast when adding an item fails with a message', async () => {
    const user = userEvent.setup();
    render(
      <CRUDPage
        {...baseProps}
        useRetrieve={() => ({ items: [], execute: vi.fn() })}
        useAdd={({ onDone }) => ({
          data: undefined,
          execute: () => onDone?.({ success: false, message: 'Add failed' } as Response<Entity>)
        })}
      />,
      { wrapper }
    );

    await user.click(screen.getByText('Add entity'));
    await user.type(screen.getByLabelText('name-input'), 'New entity');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(store.getState().pageSlice.toasts.at(-1)?.message).toBe('Add failed'));
  });

  it('dispatches an error toast when updating an item fails with a key', async () => {
    const user = userEvent.setup();
    const items = makeItems(1);
    render(
      <CRUDPage
        {...baseProps}
        useRetrieve={() => ({ items, execute: vi.fn() })}
        useUpdate={({ onDone }) => ({
          execute: () => onDone?.({ success: false, key: 'common.invalidForm' } as Response<Entity>)
        })}
        renderListItem={(item, _selected, onEdit) => (
          <div key={item.id}>
            <button onClick={() => onEdit(item)}>edit-{item.id}</button>
          </div>
        )}
      />,
      { wrapper }
    );

    await user.click(screen.getByText('edit-1'));
    await user.type(screen.getByLabelText('name-input'), ' updated');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(store.getState().pageSlice.toasts.at(-1)?.message).toBe(i18n.t('common.invalidForm')));
  });

  it('dispatches an error toast when deleting an item fails', async () => {
    const user = userEvent.setup();
    const items = makeItems(1);
    render(
      <CRUDPage
        {...baseProps}
        useRetrieve={() => ({ items, execute: vi.fn() })}
        useDelete={({ onDone }) => ({
          execute: () => onDone?.({ success: false, message: 'Delete failed' })
        })}
        renderListItem={(item, _selected, _onEdit, onDelete) => (
          <div key={item.id}>
            <button onClick={() => onDelete(item.id)}>delete-{item.id}</button>
          </div>
        )}
      />,
      { wrapper }
    );

    await user.click(screen.getByText('delete-1'));

    const dialog = await screen.findByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: /delete|common\.delete|confirm/i });
    await user.click(confirmButton);

    await waitFor(() => expect(store.getState().pageSlice.toasts.at(-1)?.message).toBe('Delete failed'));
  });

  it('delegates add clicks and lets the delegate open the form', async () => {
    const user = userEvent.setup();
    const onAddClick = vi.fn((defaultOnAdd: () => void) => defaultOnAdd());

    render(<CRUDPage {...baseProps} onAddClick={onAddClick} useRetrieve={() => ({ items: [], execute: vi.fn() })} />, {
      wrapper
    });

    await user.click(screen.getByText('Add entity'));

    expect(onAddClick).toHaveBeenCalledWith(expect.any(Function));
    expect(await screen.findByLabelText('name-input')).toBeInTheDocument();
  });

  it('normalizes imported rows and executes a batch add', async () => {
    const user = userEvent.setup();
    const addBatchExecute = vi.fn();
    const validateAndNormalize = vi.fn(async (row: unknown) => row as Entity);
    vi.mocked(importExcel).mockResolvedValue({
      columns: ['name'],
      rows: [{ name: 'Imported item' }]
    });

    const { container } = render(
      <CRUDPage
        {...baseProps}
        excelData={{
          excelColumns: ['name'],
          excelFileName: 'entities',
          excelFormat: 'xlsx',
          excelTemplateData: []
        }}
        validateAndNormalize={validateAndNormalize}
        useRetrieve={() => ({ items: [], execute: vi.fn() })}
        useAddBatch={({ item, onDone }) => ({
          execute: () => {
            addBatchExecute(item);
            onDone?.({ success: true, data: item ?? [] });
          }
        })}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: i18n.t('common.importExport') }));
    await user.click(screen.getByText(i18n.t('common.import')));
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    await user.upload(fileInput as HTMLInputElement, new File(['sheet'], 'entities.xlsx'));

    await waitFor(() => expect(addBatchExecute).toHaveBeenCalledWith([{ name: 'Imported item' }]));
    expect(validateAndNormalize).toHaveBeenCalledWith({ name: 'Imported item' });
  });

  it('sorts the rendered list through the sort controls', async () => {
    const user = userEvent.setup();
    const items = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Zulu' }
    ];

    render(
      <CRUDPage
        {...baseProps}
        componentId="entities-sort-test"
        useRetrieve={() => ({ items, execute: vi.fn() })}
        renderListItem={item => <div key={item.id}>{item.name}</div>}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.noSort') }));

    await waitFor(() => {
      const names = screen.getAllByText(/Alpha|Zulu/).map(node => node.textContent);
      expect(names).toEqual(['Zulu', 'Alpha']);
    });
  });

  it('returns to the list after saving an edit on mobile', async () => {
    isDesktop = false;
    const user = userEvent.setup();
    const items = makeItems(1);
    const updateExecute = vi.fn();

    render(
      <CRUDPage
        {...baseProps}
        componentId="entities-mobile-test"
        useRetrieve={() => ({ items, execute: vi.fn() })}
        useUpdate={({ onDone }) => ({
          execute: () => {
            updateExecute();
            onDone?.({ success: true, data: { id: 1, name: 'Updated' } });
          }
        })}
        renderListItem={(item, _selected, onEdit) => (
          <button key={item.id} onClick={() => onEdit(item)}>
            edit-{item.id}
          </button>
        )}
      />,
      { wrapper }
    );

    await user.click(screen.getByText('edit-1'));
    expect(screen.queryByText('edit-1')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('name-input'), ' updated');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(updateExecute).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('edit-1')).toBeInTheDocument();
  });
});
