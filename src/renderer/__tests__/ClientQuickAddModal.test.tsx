import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { ClientQuickAddModal } from '../pages/invoices/Form/Modals/ClientQuickAddModal';
import { clientsApi } from '../shared/api/clientsApi';
import type { Client } from '../shared/types/client';
import { store } from '../state/configureStore';

const mocks = vi.hoisted(() => ({
  trigger: vi.fn(),
  resolve: undefined as ((client: Client) => void) | undefined,
  reject: undefined as ((error: unknown) => void) | undefined
}));

vi.mock('../shared/api/clientsApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../shared/api/clientsApi')>();
  return {
    ...actual,
    useAddClientMutation: () => {
      mocks.trigger.mockImplementation(() => ({
        unwrap: () =>
          new Promise<Client>((resolve, reject) => {
            mocks.resolve = resolve;
            mocks.reject = reject;
          })
      }));
      return [mocks.trigger, { isLoading: false }];
    }
  };
});

const fakeClient: Client = {
  id: 42,
  name: 'Acme Corp',
  shortName: 'AC',
  phone: '+14155552671',
  invoiceCount: 0,
  quotesCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isArchived: false
};

const renderModal = (props: Partial<ComponentProps<typeof ClientQuickAddModal>> = {}) => {
  const onCreated = vi.fn();
  const onCancel = vi.fn();
  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <ClientQuickAddModal isOpen onCancel={onCancel} onCreated={onCreated} {...props} />
      </I18nextProvider>
    </Provider>
  );
  return { onCreated, onCancel };
};

describe('ClientQuickAddModal', () => {
  beforeEach(() => {
    mocks.trigger.mockReset();
    mocks.resolve = undefined;
    mocks.reject = undefined;
    store.dispatch(clientsApi.util.resetApiState());
  });

  it('keeps Save disabled when name is empty', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('creates a client and calls onCreated on success', async () => {
    const { onCreated } = renderModal();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Acme Corp' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mocks.trigger).toHaveBeenCalledTimes(1));
    await act(async () => {
      mocks.resolve?.(fakeClient);
    });

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(fakeClient));
  });

  it('does not call onCreated when the API fails', async () => {
    const { onCreated } = renderModal();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Acme Corp' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mocks.trigger).toHaveBeenCalledTimes(1));
    await act(async () => {
      mocks.reject?.({ key: 'error.failed' });
    });

    expect(onCreated).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid phone when provided', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: 'not-a-phone' } });
    fireEvent.blur(screen.getByLabelText(/phone/i));

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('submits at most once when Save is clicked twice in succession', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Acme Corp' } });
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    await waitFor(() => expect(mocks.trigger).toHaveBeenCalledTimes(1));
  });

  it('does not retrigger a pending save when the onCreated callback changes', async () => {
    const firstOnCreated = vi.fn();
    const nextOnCreated = vi.fn();
    const props = { isOpen: true, onCreated: firstOnCreated };
    const { rerender } = render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <ClientQuickAddModal {...props} />
        </I18nextProvider>
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Acme Corp' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(mocks.trigger).toHaveBeenCalledTimes(1));

    rerender(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <ClientQuickAddModal isOpen onCreated={nextOnCreated} />
        </I18nextProvider>
      </Provider>
    );
    expect(mocks.trigger).toHaveBeenCalledTimes(1);

    await act(async () => {
      mocks.resolve?.(fakeClient);
    });
    await waitFor(() => expect(nextOnCreated).toHaveBeenCalledWith(fakeClient));
    expect(firstOnCreated).not.toHaveBeenCalled();
  });
});
