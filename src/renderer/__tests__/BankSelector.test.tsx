import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { BankSelector } from '../pages/invoices/Form/BankSelector';

describe('BankSelector', () => {
  it('shows a clear action when a bank is selected and clears it on click', () => {
    const onClear = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <BankSelector name="Bank of Example" onEdit={vi.fn()} onClear={onClear} />
      </I18nextProvider>
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
