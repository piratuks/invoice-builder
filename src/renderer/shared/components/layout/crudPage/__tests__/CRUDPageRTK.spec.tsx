import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../../../i18n';
import { store } from '../../../../../state/configureStore';
import { importExcel } from '../../../../utils/fileFunctions';
import { CRUDPageRTK } from '../CRUDPageRTK';

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
  componentId: 'entities-rtk-test',
  searchField: 'name' as const,
  sortOptions,
  noItemText: 'No entities yet',
  noItemButtonText: 'Add entity',
  validateAndNormalize: async (data: unknown) => data as Entity,
  form: renderForm
};

const useRetrieveWith =
  (items: Entity[], overrides: Partial<ReturnType<typeof retrieveResult>> = {}) =>
  () =>
    retrieveResult(items, overrides);

const retrieveResult = (
  items: Entity[],
  overrides: {
    isLoading?: boolean;
    isFetching?: boolean;
    isError?: boolean;
    error?: unknown;
    refetch?: () => void;
  } = {}
) => ({
  data: items,
  isLoading: false,
  isFetching: false,
  isError: undefined,
  error: undefined,
  refetch: vi.fn(),
  ...overrides
});

const mutationHook =
  <TArg, TResult>(trigger: (arg: TArg) => Promise<{ data?: TResult; error?: unknown }>) =>
  () =>
    [trigger, { isLoading: false }] as const;

describe('CRUDPageRTK', () => {
  beforeEach(() => {
    localStorage.clear();
    isDesktop = true;
    vi.clearAllMocks();
  });

  it('shows the empty state and add button when there are no items', async () => {
    render(<CRUDPageRTK {...baseProps} useRetrieve={useRetrieveWith([])} />, { wrapper });

    expect(await screen.findByText('No entities yet')).toBeInTheDocument();
    expect(screen.getByText('Add entity')).toBeInTheDocument();
  });

  it('renders a list item for each retrieved entity', () => {
    const items = makeItems(3);
    render(
      <CRUDPageRTK
        {...baseProps}
        useRetrieve={useRetrieveWith(items)}
        renderListItem={item => <div key={item.id}>{item.name}</div>}
      />,
      { wrapper }
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('opens the add form and calls the add mutation trigger on save', async () => {
    const user = userEvent.setup();
    const addTrigger = vi.fn(async () => ({ data: { id: 1, name: 'New item' } as Entity }));

    render(
      <CRUDPageRTK<Entity, Entity, Entity>
        {...baseProps}
        useRetrieve={useRetrieveWith([])}
        useAdd={mutationHook<Entity, Entity>(addTrigger)}
      />,
      { wrapper }
    );

    await user.click(screen.getByText('Add entity'));
    const input = await screen.findByLabelText('name-input');
    await user.type(input, 'New item');
    await user.click(screen.getByRole('button', { name: /save|common\.save/i }));

    await waitFor(() => expect(addTrigger).toHaveBeenCalledWith({ id: undefined, name: 'New item' }));
  });

  it('calls the update mutation trigger when editing an existing item', async () => {
    const user = userEvent.setup();
    const items = makeItems(1);
    const updateTrigger = vi.fn(async (arg: Entity) => ({ data: arg }));

    render(
      <CRUDPageRTK<Entity, Entity, Entity>
        {...baseProps}
        useRetrieve={useRetrieveWith(items)}
        useUpdate={mutationHook(updateTrigger)}
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

    await waitFor(() => expect(updateTrigger).toHaveBeenCalled());
  });

  it('deletes an item after confirming the delete dialog', async () => {
    const user = userEvent.setup();
    const deleteTrigger = vi.fn(async () => ({ data: undefined }));
    const items = makeItems(1);

    render(
      <CRUDPageRTK<Entity, Entity, Entity>
        {...baseProps}
        useRetrieve={useRetrieveWith(items)}
        useDelete={mutationHook<number, unknown>(deleteTrigger)}
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

    await waitFor(() => expect(deleteTrigger).toHaveBeenCalledWith(1));
  });

  it('duplicates an item via the injected useDuplicate mutation hook', async () => {
    const user = userEvent.setup();
    const items = makeItems(1);
    const duplicateTrigger = vi.fn(async () => ({ data: { id: 2, name: 'Item 1 copy' } as Entity }));

    render(
      <CRUDPageRTK<Entity, Entity, Entity>
        {...baseProps}
        useRetrieve={useRetrieveWith(items)}
        useDuplicate={mutationHook<number, Entity>(duplicateTrigger)}
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

    await waitFor(() => expect(duplicateTrigger).toHaveBeenCalledWith(1));
  });

  it('dispatches an error toast when the add mutation fails with a message', async () => {
    const user = userEvent.setup();
    const addTrigger = vi.fn(async () => ({ error: { message: 'Add failed' } }));

    render(
      <CRUDPageRTK<Entity, Entity, Entity>
        {...baseProps}
        useRetrieve={useRetrieveWith([])}
        useAdd={mutationHook<Entity, Entity>(addTrigger)}
      />,
      {
        wrapper
      }
    );

    await user.click(screen.getByText('Add entity'));
    await user.type(screen.getByLabelText('name-input'), 'New entity');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(store.getState().pageSlice.toasts.at(-1)?.message).toBe('Add failed'));
  });

  it('dispatches an error toast when the update mutation fails with a key', async () => {
    const user = userEvent.setup();
    const items = makeItems(1);
    const updateTrigger = vi.fn(async () => ({ error: { key: 'common.invalidForm' } }));

    render(
      <CRUDPageRTK<Entity, Entity, Entity>
        {...baseProps}
        useRetrieve={useRetrieveWith(items)}
        useUpdate={mutationHook<Entity, Entity>(updateTrigger)}
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

  it('dispatches an error toast when the delete mutation fails', async () => {
    const user = userEvent.setup();
    const items = makeItems(1);
    const deleteTrigger = vi.fn(async () => ({ error: { message: 'Delete failed' } }));

    render(
      <CRUDPageRTK<Entity, Entity, Entity>
        {...baseProps}
        useRetrieve={useRetrieveWith(items)}
        useDelete={mutationHook(deleteTrigger)}
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

  it('dispatches an error toast when the retrieve query fails', async () => {
    render(
      <CRUDPageRTK
        {...baseProps}
        useRetrieve={useRetrieveWith([], { isError: true, error: { message: 'Retrieve failed' } })}
      />,
      { wrapper }
    );

    await waitFor(() => expect(store.getState().pageSlice.toasts.at(-1)?.message).toBe('Retrieve failed'));
  });

  it('toggles the loading cursor while retrieving and while background-refetching', async () => {
    const { rerender } = render(<CRUDPageRTK {...baseProps} useRetrieve={useRetrieveWith([], { isLoading: true })} />, {
      wrapper
    });

    await waitFor(() => expect(document.body.style.cursor).toBe('wait'));

    rerender(<CRUDPageRTK {...baseProps} useRetrieve={useRetrieveWith(makeItems(1), { isFetching: true })} />);

    await waitFor(() => expect(document.body.style.cursor).toBe('wait'));

    rerender(<CRUDPageRTK {...baseProps} useRetrieve={useRetrieveWith(makeItems(1))} />);

    await waitFor(() => expect(document.body.style.cursor).toBe('default'));
  });

  it('normalizes imported rows and executes a batch add mutation', async () => {
    const user = userEvent.setup();
    const addBatchTrigger = vi.fn(async (arg: Entity[]) => ({ data: arg }));
    vi.mocked(importExcel).mockResolvedValue({
      columns: ['name'],
      rows: [{ name: 'Imported item' }]
    });

    const { container } = render(
      <CRUDPageRTK<Entity, Entity, Entity>
        {...baseProps}
        excelData={{
          excelColumns: ['name'],
          excelFileName: 'entities',
          excelFormat: 'xlsx',
          excelTemplateData: []
        }}
        useRetrieve={useRetrieveWith([])}
        useAddBatch={mutationHook(addBatchTrigger)}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: i18n.t('common.importExport') }));
    await user.click(screen.getByText(i18n.t('common.import')));
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    await user.upload(fileInput as HTMLInputElement, new File(['sheet'], 'entities.xlsx'));

    await waitFor(() => expect(addBatchTrigger).toHaveBeenCalledWith([{ name: 'Imported item' }]));
  });
});
