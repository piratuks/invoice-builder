import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../../../i18n';
import { LabelModal } from '../LabelModal';

const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;

describe('LabelModal', () => {
  it('loads changed label metadata and saves a custom value', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const { rerender } = render(
      <LabelModal
        isOpen
        currLabelMeta={{ key: 'invoice' as never, label: 'Invoice label', value: 'Invoice' }}
        onSave={onSave}
      />,
      { wrapper }
    );
    const input = screen.getByRole('textbox', { name: i18n.t('common.label') });
    expect(input).toHaveValue('Invoice');

    rerender(
      <I18nextProvider i18n={i18n}>
        <LabelModal
          isOpen
          currLabelMeta={{ key: 'invoice' as never, label: 'Updated label', value: 'Bill' }}
          onSave={onSave}
        />
      </I18nextProvider>
    );
    const updatedInput = screen.getByRole('textbox', { name: i18n.t('common.label') });
    await waitFor(() => expect(updatedInput).toHaveValue('Bill'));
    await user.clear(updatedInput);
    await user.type(updatedInput, 'Receipt');
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    expect(onSave).toHaveBeenCalledWith('Receipt');
  });

  it('normalizes an empty label to undefined and supports cancellation', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<LabelModal isOpen currLabelMeta={undefined} onSave={onSave} onCancel={onCancel} />, { wrapper });

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    expect(onSave).toHaveBeenCalledWith(undefined);
    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.back') }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not mount dialog content while closed', () => {
    render(<LabelModal isOpen={false} currLabelMeta={{ key: 'invoice' as never, label: 'Hidden' }} />, { wrapper });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
