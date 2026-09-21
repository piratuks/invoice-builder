import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import type { Settings } from '../../../../shared/types/settings';
import { store } from '../../../../state/configureStore';
import { setSettings } from '../../../../state/pageSlice';
import { CustomizeInvoice } from '../CustomizeInvoice';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('CustomizeInvoice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.dispatch(
      setSettings({
        invoicePrefix: 'INV',
        invoiceSuffix: 'OLD',
        shouldIncludeMonth: true,
        shouldIncludeYear: true,
        shouldIncludeBusinessName: true
      } as Settings)
    );
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('emits valid prefix and suffix changes after replacing the pending debounce', () => {
    const onCustomizedInvoice = vi.fn();
    render(<CustomizeInvoice showBack={false} onCustomizedInvoice={onCustomizedInvoice} />, { wrapper });

    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('common.invoicePrefix') }), {
      target: { value: 'NEW1' }
    });
    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('common.invoiceSuffix') }), {
      target: { value: 'END2' }
    });
    vi.advanceTimersByTime(500);

    expect(onCustomizedInvoice).toHaveBeenCalled();
    expect(onCustomizedInvoice).toHaveBeenLastCalledWith({
      prefix: 'NEW1',
      suffix: 'END2',
      includeMonth: true,
      includeYear: true,
      includeBusinessName: true
    });
  });

  it('rejects punctuation and emits each switch value immediately', () => {
    const onCustomizedInvoice = vi.fn();
    const { container } = render(<CustomizeInvoice showBack={false} onCustomizedInvoice={onCustomizedInvoice} />, {
      wrapper
    });

    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('common.invoicePrefix') }), {
      target: { value: 'BAD!' }
    });
    expect(screen.getByRole('textbox', { name: i18n.t('common.invoicePrefix') })).toHaveValue('INV');

    const switches = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    switches.forEach(control => fireEvent.click(control));

    expect(onCustomizedInvoice).toHaveBeenCalledWith(expect.objectContaining({ includeYear: false }));
    expect(onCustomizedInvoice).toHaveBeenCalledWith(expect.objectContaining({ includeMonth: false }));
    expect(onCustomizedInvoice).toHaveBeenCalledWith(expect.objectContaining({ includeBusinessName: false }));
  });

  it('uses fallback values without settings and forwards back navigation', () => {
    store.dispatch({ type: 'pageSlice/logout' });
    const onBack = vi.fn();
    const { container } = render(<CustomizeInvoice showBack onBack={onBack} />, { wrapper });

    expect(screen.getByRole('textbox', { name: i18n.t('common.invoicePrefix') })).toHaveValue('');
    expect(
      Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).every(
        control => control.checked
      )
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('ariaLabel.back') }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
