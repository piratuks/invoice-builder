import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../../i18n';
import { store } from '../../../../../state/configureStore';
import { ProfileNameSetter } from '../ProfileNameSetter';

vi.mock('../../../../../shared/components/layout/modalAppBar/ModalAppBar', () => ({
  ModalAppBar: ({
    isFormValid,
    onSave,
    onClose
  }: {
    isFormValid: boolean;
    onSave: (value: unknown) => void;
    onClose: () => void;
  }) => (
    <div>
      <button type="button" disabled={!isFormValid} onClick={() => onSave('Brand name')}>
        save-profile
      </button>
      <button type="button" onClick={onClose}>
        cancel-profile
      </button>
    </div>
  )
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('ProfileNameSetter', () => {
  it('validates a name and saves or cancels the profile', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<ProfileNameSetter isOpen onSave={onSave} onCancel={onCancel} />, { wrapper });

    const save = screen.getByRole('button', { name: /save-profile/i });
    expect(save).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Brand name');
    await user.click(save);
    await user.click(screen.getByRole('button', { name: /cancel-profile/i }));

    expect(onSave).toHaveBeenCalledWith('Brand name');
    expect(onCancel).toHaveBeenCalled();
  });
});
