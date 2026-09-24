import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../i18n';
import { ConnectionSetter } from '../ConnectionSetter';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  execute: vi.fn(),
  pending: undefined as { resolve: (value: unknown) => void; reject: (reason: unknown) => void } | undefined,
  hookOptions: undefined as
    { onDone: (result: { success: boolean; message?: string; key?: string }) => void } | undefined
}));

vi.mock('../../../../state/configureStore', () => ({
  useAppDispatch: () => mocks.dispatch
}));

vi.mock('../../../../shared/api/dbSelectorApi', () => ({
  useTestConnectionMutation: () => {
    mocks.hookOptions = {
      onDone: result => (result.success ? mocks.pending?.resolve(undefined) : mocks.pending?.reject(result))
    };
    mocks.execute.mockImplementation(() => ({
      unwrap: () =>
        new Promise((resolve, reject) => {
          mocks.pending = { resolve, reject };
        })
    }));
    return [mocks.execute, { isLoading: false }];
  }
}));

vi.mock('../../../../shared/components/layout/modalAppBar/ModalAppBar', () => ({
  ModalAppBar: ({
    isFormValid,
    formData,
    onClose,
    onSave,
    renderCustomButtons
  }: {
    isFormValid: boolean;
    formData: unknown;
    onClose: () => void;
    onSave: (data: unknown) => void;
    renderCustomButtons: () => ReactNode;
  }) => (
    <div>
      <button onClick={onClose}>Cancel</button>
      <button disabled={!isFormValid} onClick={() => onSave(formData)}>
        Save
      </button>
      {renderCustomButtons()}
    </div>
  )
}));

const renderForm = (props: Partial<React.ComponentProps<typeof ConnectionSetter>> = {}) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ConnectionSetter isOpen {...props} />
    </I18nextProvider>
  );

describe('ConnectionSetter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hookOptions = undefined;
    mocks.pending = undefined;
  });

  it('validates required fields and saves the entered connection', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    renderForm({ onSave, onCancel });

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    const host = screen.getByRole('textbox', { name: /host/i });
    await user.type(host, 'x');
    await user.clear(host);
    expect(await screen.findByText(i18n.t('common.fieldRequired'))).toBeInTheDocument();

    await user.type(host, 'db.example.test');
    await user.type(screen.getByRole('textbox', { name: /database/i }), 'invoices');
    await user.type(screen.getByRole('textbox', { name: /user/i }), 'accountant');
    await user.type(screen.getByLabelText(i18n.t('common.password')), 'secret');
    fireEvent.change(screen.getByRole('spinbutton', { name: /port/i }), { target: { value: '5433' } });
    const ssl = screen.getByRole('switch', { name: i18n.t('common.ssl') });
    await user.click(ssl);
    expect(ssl).toBeChecked();

    const save = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    expect(onSave).toHaveBeenCalledWith({
      host: 'db.example.test',
      port: 5433,
      user: 'accountant',
      password: 'secret',
      database: 'invoices',
      ssl: true
    });
  });

  it('validates every required text field and supports default handlers', async () => {
    const user = userEvent.setup();
    renderForm();

    for (const name of [i18n.t('common.host'), i18n.t('common.database'), i18n.t('common.user')]) {
      const field = screen.getByRole('textbox', { name });
      await user.type(field, 'value');
      await user.clear(field);
      expect(field).toHaveAttribute('aria-invalid', 'true');
      await user.type(field, 'value');
      expect(field).toHaveAttribute('aria-invalid', 'false');
    }

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('reports successful and failed connection tests', async () => {
    const user = userEvent.setup();
    renderForm();
    const testButton = screen.getByRole('button', { name: i18n.t('common.testConnection') });

    await user.click(testButton);
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(testButton).toBeDisabled();

    act(() => mocks.hookOptions!.onDone({ success: true }));
    await waitFor(() => expect(testButton).toBeEnabled());
    expect(mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ severity: 'success' }) })
    );

    await user.click(testButton);
    act(() => mocks.hookOptions!.onDone({ success: false, message: 'Server unavailable' }));
    await waitFor(() => expect(testButton).toBeEnabled());
    expect(mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { message: 'Server unavailable', severity: 'error' } })
    );

    await user.click(testButton);
    act(() => mocks.hookOptions!.onDone({ success: false, message: 'error.failedToLoad' }));
    await waitFor(() => expect(testButton).toBeEnabled());
    expect(mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { message: i18n.t('error.failedToLoad'), severity: 'error' } })
    );

    await user.click(testButton);
    act(() => mocks.hookOptions!.onDone({ success: false, key: 'error.failedToLoad' }));
    await waitFor(() => expect(testButton).toBeEnabled());
    expect(mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ severity: 'error' }) })
    );

    const dispatchCount = mocks.dispatch.mock.calls.length;
    await user.click(testButton);
    act(() => mocks.hookOptions!.onDone({ success: false }));
    await waitFor(() => expect(testButton).toBeEnabled());
    expect(mocks.dispatch).toHaveBeenCalledTimes(dispatchCount + 2);
  });
});
