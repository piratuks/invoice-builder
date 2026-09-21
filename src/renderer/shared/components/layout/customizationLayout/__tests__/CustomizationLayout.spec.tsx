import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../../i18n';
import { store } from '../../../../../state/configureStore';
import { CustomizationLayout } from '../CustomizationLayout';

vi.mock('../tabs/PageSetupTab', () => ({
  PageSetupTab: ({ onChange }: { onChange: (value: Record<string, unknown>) => void }) => (
    <button type="button" onClick={() => onChange({ pageFormat: 'a4' })}>
      page-change
    </button>
  )
}));
vi.mock('../tabs/BrandingTab', () => ({
  BrandingTab: ({ onChange }: { onChange: (value: Record<string, unknown>) => void }) => (
    <button type="button" onClick={() => onChange({ color: '#123456' })}>
      branding-change
    </button>
  )
}));
vi.mock('../tabs/TableTab', () => ({
  TableTab: ({ onChange }: { onChange: (value: Record<string, unknown>) => void }) => (
    <button type="button" onClick={() => onChange({ showQuantity: false })}>
      table-change
    </button>
  )
}));
vi.mock('../tabs/TypographyLabelsTab', () => ({
  TypographyLabelsTab: ({ onChange }: { onChange: (value: Record<string, unknown>) => void }) => (
    <button type="button" onClick={() => onChange({ labelUpperCase: true })}>
      typography-change
    </button>
  )
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('CustomizationLayout', () => {
  it('switches tabs and emits merged customization changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomizationLayout data={{ color: '#000000' } as never} onChange={onChange} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /page-change/i }));
    await user.click(screen.getByRole('tab', { name: /branding/i }));
    await user.click(screen.getByRole('button', { name: /branding-change/i }));
    await user.click(screen.getByRole('tab', { name: /table/i }));
    await user.click(screen.getByRole('button', { name: /table-change/i }));
    await user.click(screen.getByRole('tab', { name: /typography/i }));
    await user.click(screen.getByRole('button', { name: /typography-change/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ color: '#123456', showQuantity: false, labelUpperCase: true })
    );
  });
});
