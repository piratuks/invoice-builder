import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import type { Settings } from '../../../../shared/types/settings';
import { store } from '../../../../state/configureStore';
import { setSettings } from '../../../../state/pageSlice';
import { RangeSetter } from '../RangeSetter';

vi.mock('../../../../shared/components/inputs/datepicker/Datepicker', () => ({
  Datepicker: ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
    <input aria-label={label} value={value} onChange={event => onChange(event.target.value)} />
  )
}));
vi.mock('../../../../shared/components/layout/modalAppBar/ModalAppBar', () => ({
  ModalAppBar: ({
    title,
    formData,
    onClose,
    onSave
  }: {
    title: string;
    formData: unknown;
    onClose: () => void;
    onSave: (data: unknown) => void;
  }) => (
    <>
      <span>{title}</span>
      <button aria-label="range-back" onClick={onClose} />
      <button onClick={() => onSave(formData)}>range-save</button>
    </>
  )
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('RangeSetter', () => {
  beforeEach(() => store.dispatch(setSettings({ dateFormat: 'MM/dd/yyyy' } as Settings)));

  it('updates both dates, saves the form, and closes from the app bar', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<RangeSetter isOpen fromDate="2026-01-01" to="2026-01-31" onSave={onSave} onCancel={onCancel} />, {
      wrapper
    });

    fireEvent.change(screen.getByLabelText(i18n.t('common.from')), { target: { value: '2026-02-01' } });
    fireEvent.change(screen.getByLabelText(i18n.t('common.to')), { target: { value: '2026-02-28' } });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'range-save' }));
      fireEvent.click(screen.getByRole('button', { name: 'range-back' }));
    });

    expect(onSave).toHaveBeenCalledWith({ from: '2026-02-01', to: '2026-02-28' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('synchronizes changed props and omits date inputs without settings', () => {
    const { rerender } = render(<RangeSetter isOpen fromDate="2026-03-01" to="2026-03-31" />, { wrapper });

    rerender(<RangeSetter isOpen fromDate="2026-04-01" to="2026-04-30" />);
    expect(screen.getByLabelText(i18n.t('common.from'))).toHaveValue('2026-04-01');
    expect(screen.getByLabelText(i18n.t('common.to'))).toHaveValue('2026-04-30');

    act(() => store.dispatch({ type: 'pageSlice/logout' }));
    expect(screen.queryByLabelText(i18n.t('common.from'))).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18n.t('common.to'))).not.toBeInTheDocument();
  });

  it('does not mount dialog content while closed', () => {
    render(<RangeSetter isOpen={false} fromDate="" to="" />, { wrapper });
    expect(screen.queryByText(i18n.t('reports.selectDateRange'))).not.toBeInTheDocument();
  });
});
