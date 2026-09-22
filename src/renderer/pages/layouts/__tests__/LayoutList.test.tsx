import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { store } from '../../../state/configureStore';
import { List } from '../List';

const { exportLayoutTrigger, useExportLayoutMutation } = vi.hoisted(() => ({
  exportLayoutTrigger: vi.fn().mockResolvedValue({ data: { filePath: 'layout.json' } }),
  useExportLayoutMutation: vi.fn()
}));

vi.mock('../../../shared/api/layoutsApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../shared/api/layoutsApi')>();
  return {
    ...actual,
    useExportLayoutMutation
  };
});

vi.mock('../../../shared/components/lists/genericList/GenericList', () => ({
  GenericList: ({
    onExport,
    getName
  }: {
    onExport: () => void;
    getName: (item: { schema: { meta: { name: string } } }) => string;
  }) => (
    <button type="button" onClick={onExport}>
      export {getName({ schema: { meta: { name: 'Receipt layout' } } })}
    </button>
  )
}));

describe('Layout list export', () => {
  it('wires the layout export action to the selected layout ID', async () => {
    useExportLayoutMutation.mockReturnValue([exportLayoutTrigger, { isLoading: false }]);
    const item = {
      id: 42,
      schema: { schemaVersion: 1 as const, meta: { name: 'Receipt layout' }, sections: [] },
      isArchived: false,
      invoiceCount: 0,
      quotesCount: 0,
      createdAt: '',
      updatedAt: ''
    };

    render(
      <Provider store={store}>
        <List item={item} onEdit={vi.fn()} onDelete={vi.fn()} />
      </Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'export Receipt layout' }));

    expect(exportLayoutTrigger).toHaveBeenCalledWith(42);
  });

  it('shows the loading cursor while the export mutation is in flight', () => {
    const item = {
      id: 7,
      schema: { schemaVersion: 1 as const, meta: { name: 'Invoice layout' }, sections: [] },
      isArchived: false,
      invoiceCount: 0,
      quotesCount: 0,
      createdAt: '',
      updatedAt: ''
    };

    useExportLayoutMutation.mockReturnValue([exportLayoutTrigger, { isLoading: true }]);
    const { rerender } = render(
      <Provider store={store}>
        <List item={item} onEdit={vi.fn()} onDelete={vi.fn()} />
      </Provider>
    );
    expect(document.body.style.cursor).toBe('wait');

    useExportLayoutMutation.mockReturnValue([exportLayoutTrigger, { isLoading: false }]);
    rerender(
      <Provider store={store}>
        <List item={item} onEdit={vi.fn()} onDelete={vi.fn()} />
      </Provider>
    );
    expect(document.body.style.cursor).toBe('default');
  });
});
