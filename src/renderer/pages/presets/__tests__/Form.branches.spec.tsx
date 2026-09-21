import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { Language } from '../../../shared/enums/language';
import type { PresetFromData } from '../../../shared/types/preset';
import { store } from '../../../state/configureStore';
import { setSettings } from '../../../state/pageSlice';
import { Form } from '../Form';

vi.mock('../../invoices/Form/Dropdowns/BusinessesDropdown', () => ({
  BusinessesDropdown: ({
    onClick,
    onClose,
    onOpen
  }: {
    onClick: (value: never) => void;
    onClose: () => void;
    onOpen: () => void;
  }) => (
    <div>
      <button onClick={onOpen}>open-business</button>
      <button onClick={onClose}>close-business</button>
      <button onClick={() => onClick({ id: 1, name: 'Business' } as never)}>select-business</button>
    </div>
  )
}));
vi.mock('../../invoices/Form/Dropdowns/ClientsDropdown', () => ({
  ClientsDropdown: ({
    onClick,
    onClose,
    onOpen
  }: {
    onClick: (value: never) => void;
    onClose: () => void;
    onOpen: () => void;
  }) => (
    <div>
      <button onClick={onOpen}>open-client</button>
      <button onClick={onClose}>close-client</button>
      <button onClick={() => onClick({ id: 2, name: 'Client' } as never)}>select-client</button>
    </div>
  )
}));
vi.mock('../../invoices/Form/Dropdowns/CurrenciesDropdown', () => ({
  CurrenciesDropdown: ({
    onClick,
    onClose,
    onOpen
  }: {
    onClick: (value: never) => void;
    onClose: () => void;
    onOpen: () => void;
  }) => (
    <div>
      <button onClick={onOpen}>open-currency</button>
      <button onClick={onClose}>close-currency</button>
      <button onClick={() => onClick({ id: 3, code: 'EUR', symbol: '€' } as never)}>select-currency</button>
    </div>
  )
}));
vi.mock('../../invoices/Form/Dropdowns/StyleProfilesDropdown', () => ({
  StyleProfilesDropdown: ({
    onClick,
    onClose,
    onOpen
  }: {
    onClick: (value: never) => void;
    onClose: () => void;
    onOpen: () => void;
  }) => (
    <div>
      <button onClick={onOpen}>open-style</button>
      <button onClick={onClose}>close-style</button>
      <button onClick={() => onClick({ id: 4, name: 'Modern' } as never)}>select-style</button>
    </div>
  )
}));
vi.mock('../../invoices/Form/Dropdowns/BanksDropdown', () => ({
  BanksDropdown: ({
    onClick,
    onClose,
    onOpen
  }: {
    onClick: (value: never) => void;
    onClose: () => void;
    onOpen: () => void;
  }) => (
    <div>
      <button onClick={onOpen}>open-bank</button>
      <button onClick={onClose}>close-bank</button>
      <button onClick={() => onClick({ id: 5, name: 'Primary' } as never)}>select-bank</button>
    </div>
  )
}));
vi.mock('../../invoices/Form/Dropdowns/LanguageDropdown', () => ({
  LanguageDropdown: ({
    onClick,
    onClose,
    onOpen
  }: {
    onClick: (value: never) => void;
    onClose: () => void;
    onOpen: () => void;
  }) => (
    <div>
      <button onClick={onOpen}>open-language</button>
      <button onClick={onClose}>close-language</button>
      <button onClick={() => onClick('de' as never)}>select-language</button>
    </div>
  )
}));

vi.mock('../../invoices/Form/CurrencySelector', () => ({
  CurrencySelector: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>edit-currency</button>
}));
vi.mock('../../invoices/Form/BankSelector', () => ({
  BankSelector: ({ onEdit, onClear }: { onEdit: () => void; onClear: () => void }) => (
    <div>
      <button onClick={onEdit}>edit-bank</button>
      <button onClick={onClear}>clear-bank</button>
    </div>
  )
}));
vi.mock('../../invoices/Form/StyleProfileSelector', () => ({
  StyleProfileSelector: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>edit-style</button>
}));
vi.mock('../../invoices/Form/LanguageSelector', () => ({
  LanguageSelector: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>edit-language</button>
}));
vi.mock('../../invoices/Form/BusinessSelector', () => ({
  BusinessSelector: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>edit-business</button>
}));
vi.mock('../../invoices/Form/ClientSelector', () => ({
  ClientSelector: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>edit-client</button>
}));
vi.mock('../../invoices/Form/NotesSelector', () => ({
  NotesSelector: ({
    onCustomerNotesChanged,
    onThanksNotesChanged,
    onTermsConditionsNotesChanged
  }: {
    onCustomerNotesChanged: (value: string) => void;
    onThanksNotesChanged: (value: string) => void;
    onTermsConditionsNotesChanged: (value: string) => void;
  }) => (
    <div>
      <button onClick={() => onCustomerNotesChanged('Customer')}>customer-note</button>
      <button onClick={() => onThanksNotesChanged('Thanks')}>thanks-note</button>
      <button onClick={() => onTermsConditionsNotesChanged('Terms')}>terms-note</button>
    </div>
  )
}));
vi.mock('../../invoices/Form/SignatureSelector', () => ({
  SignatureSelector: ({ onEdit }: { onEdit: (value: never) => void }) => (
    <button onClick={() => onEdit({ data: 'data', name: 'Signer', type: 'png', size: 'small' } as never)}>
      edit-signature
    </button>
  )
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nextProvider>
  </Provider>
);

describe('preset form branches', () => {
  beforeEach(() => {
    store.dispatch(setSettings({ styleProfilesON: true } as never));
  });

  it('updates every selectable and editable preset field', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    for (const name of ['business', 'client', 'currency', 'style', 'bank', 'language']) {
      await user.click(screen.getByRole('button', { name: `open-${name}` }));
      await user.click(screen.getByRole('button', { name: `close-${name}` }));
      await user.click(screen.getByRole('button', { name: `select-${name}` }));
    }
    for (const name of ['customer-note', 'thanks-note', 'terms-note', 'edit-signature', 'clear-bank']) {
      await user.click(screen.getByRole('button', { name }));
    }

    await waitFor(() => {
      const form = handleChange.mock.calls.at(-1)?.[0]?.preset as PresetFromData;
      expect(form).toEqual(
        expect.objectContaining({
          businessId: 1,
          clientId: 2,
          currencyId: 3,
          styleProfilesId: 4,
          bankId: undefined,
          language: Language.de,
          customerNotes: 'Customer',
          thanksNotes: 'Thanks',
          termsConditionNotes: 'Terms',
          signatureName: 'Signer'
        })
      );
    });
  });

  it('opens selectors through the visible selector controls', async () => {
    const user = userEvent.setup();
    render(<Form />, { wrapper });

    for (const name of ['edit-currency', 'edit-bank', 'edit-style', 'edit-language', 'edit-business', 'edit-client']) {
      await user.click(screen.getByRole('button', { name }));
    }

    expect(screen.getByRole('textbox', { name: i18n.t('common.name') })).toBeInTheDocument();
  });
});
