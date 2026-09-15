import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { List } from '../pages/layouts/List';

const { exportLayout, useExportLayout } = vi.hoisted(() => ({
  exportLayout: vi.fn(),
  useExportLayout: vi.fn()
}));

vi.mock('../shared/hooks/layouts/useLayoutExport', () => ({
  useExportLayout
}));

vi.mock('../shared/components/lists/genericList/GenericList', () => ({
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
  it('wires the layout export action to the selected layout ID', () => {
    useExportLayout.mockReturnValue({ execute: exportLayout });
    const item = {
      id: 42,
      schema: { schemaVersion: 1 as const, meta: { name: 'Receipt layout' }, sections: [] },
      isArchived: false,
      invoiceCount: 0,
      quotesCount: 0,
      createdAt: '',
      updatedAt: ''
    };

    render(<List item={item} onEdit={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'export Receipt layout' }));

    expect(useExportLayout).toHaveBeenCalledWith({ id: 42, immediate: false });
    expect(exportLayout).toHaveBeenCalledTimes(1);
  });
});
