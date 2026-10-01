import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../../i18n';
import { store } from '../../../../../state/configureStore';
import { NoteDropdown } from '../NoteDropdown';

vi.mock('../../../../../shared/components/layout/pageHeader/PageHeader', () => ({
  PageHeader: ({ onSave, formData }: { onSave: (value: unknown) => void; formData?: unknown }) => (
    <button type="button" onClick={() => onSave(formData)}>
      save-note
    </button>
  )
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('NoteDropdown', () => {
  it('edits and saves the current note', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<NoteDropdown isOpen title="Customer note" currentNote="Old note" onClick={onClick} />, { wrapper });

    const input = screen.getByRole('textbox', { name: 'Customer note' });
    await user.clear(input);
    await user.type(input, 'New note');
    await user.click(screen.getByRole('button', { name: /save-note/i }));

    expect(onClick).toHaveBeenCalledWith('New note');
  });
});
