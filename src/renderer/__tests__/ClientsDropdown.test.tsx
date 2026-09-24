import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { ClientsDropdown } from '../pages/invoices/Form/Dropdowns/ClientsDropdown';
import type { Client } from '../shared/types/client';

const fakeClient: Client = {
  id: 7,
  name: 'New Client',
  shortName: 'NC',
  phone: '+14155552671',
  invoiceCount: 0,
  quotesCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isArchived: false
};

vi.mock('../shared/components/layout/crudPage/CRUDPageRTK', () => ({
  CRUDPageRTK: ({ renderListToolbarActions }: { renderListToolbarActions?: () => React.ReactNode }) => (
    <div data-testid="crud-page">{renderListToolbarActions?.()}</div>
  )
}));

vi.mock('../shared/api/clientsApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../shared/api/clientsApi')>()),
  useGetClientsQuery: () => ({ data: [], isLoading: false, isFetching: false })
}));

vi.mock('../pages/invoices/Form/Modals/ClientQuickAddModal', () => ({
  ClientQuickAddModal: ({ isOpen, onCreated }: { isOpen: boolean; onCreated?: (client: Client) => void }) =>
    isOpen ? (
      <button type="button" aria-label="mock-quick-add-save" onClick={() => onCreated?.(fakeClient)}>
        save
      </button>
    ) : null
}));

describe('ClientsDropdown', () => {
  it('forwards a newly created client through onClick', () => {
    const onClick = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <ClientsDropdown isOpen onClick={onClick} />
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /add bill to/i }));
    fireEvent.click(screen.getByRole('button', { name: /mock-quick-add-save/i, hidden: true }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(fakeClient);
  });
});
