import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../../i18n';
import { Language } from '../../../../../shared/enums/language';
import type { CustomizationForm } from '../../../../../shared/types/invoice';
import { store } from '../../../../../state/configureStore';
import { CustomizationDropdown } from '../CustomizationDropdown';

type MockPageHeaderProps = {
  renderCustomButtons?: () => ReactNode;
  onClose?: () => void;
};

type MockCustomizationLayoutProps = {
  onChange: (data: Record<string, unknown>) => void;
};

type MockProfileNameSetterProps = {
  onCancel: () => void;
  onSave: (name: string) => void;
};

vi.mock('../../../../../shared/components/layout/pageHeader/PageHeader', () => ({
  PageHeader: ({ renderCustomButtons, onClose }: MockPageHeaderProps) => (
    <div>
      <button type="button" onClick={onClose}>
        close-customization
      </button>
      {renderCustomButtons?.()}
    </div>
  )
}));

vi.mock('../../../../../shared/components/layout/customizationLayout/CustomizationLayout', () => ({
  CustomizationLayout: ({ onChange }: MockCustomizationLayoutProps) => (
    <button type="button" onClick={() => onChange({ color: '#123456', fieldSortOrders: {} })}>
      change-customization
    </button>
  )
}));

vi.mock('../../../Form/Modals/ProfileNameSetter', () => ({
  ProfileNameSetter: ({ onCancel, onSave }: MockProfileNameSetterProps) => (
    <div>
      <button type="button" onClick={onCancel}>
        cancel-profile
      </button>
      <button type="button" onClick={() => onSave('Brand')}>
        save-profile-name
      </button>
    </div>
  )
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const data = {
  color: '#000000',
  layoutId: 1,
  language: Language.en,
  fieldSortOrders: {}
} as unknown as CustomizationForm;

describe('CustomizationDropdown', () => {
  it('forwards customization changes and saves the provided profile data', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSaveProfile = vi.fn();
    render(
      <CustomizationDropdown
        isOpen
        data={data}
        onClick={onClick}
        onSaveProfile={onSaveProfile}
        language={Language.en}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('button', { name: /change-customization/i }));
    await user.click(screen.getByRole('button', { name: /save as profile/i }));
    await user.click(screen.getByRole('button', { name: /save-profile-name/i }));

    expect(onClick).toHaveBeenCalledWith({ color: '#123456', fieldSortOrders: {} });
    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Brand', color: '#123456' }));
  });

  it('saves changed form data and supports closing the drawer', async () => {
    const user = userEvent.setup();
    const onSaveProfile = vi.fn();
    const onClose = vi.fn();
    render(<CustomizationDropdown isOpen data={data} onSaveProfile={onSaveProfile} onClose={onClose} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /change-customization/i }));
    await user.click(screen.getByRole('button', { name: /save as profile/i }));
    await user.click(screen.getByRole('button', { name: /save-profile-name/i }));
    await user.click(screen.getByRole('button', { name: /close-customization/i }));

    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Brand', color: '#123456' }));
    expect(onClose).toHaveBeenCalled();
  });
});
