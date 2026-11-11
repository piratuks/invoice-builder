import type { StyleProfile } from '@invoice-builder/contracts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';

import { store } from '../../../state/configureStore';
import { Form } from '../Form';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('styleProfiles Form', () => {
  it('reports an invalid form when the required name field is empty', async () => {
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ isFormValid: false })));
  });

  it('becomes valid once a name is entered', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Form handleChange={handleChange} />, { wrapper });

    await user.type(screen.getByRole('textbox', { name: i18n.t('common.name') }), 'Test Profile');

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isFormValid: true,
          styleProfile: expect.objectContaining({ name: 'Test Profile' })
        })
      )
    );
  });

  it('pre-fills the name field from an existing style profile', () => {
    const styleProfile: StyleProfile = {
      id: 1,
      name: 'Existing Profile',
      isArchived: false,
      showQuantity: true,
      showUnit: true,
      showRowNo: true,
      invoiceCount: 0,
      quotesCount: 0
    } as StyleProfile;

    render(<Form styleProfile={styleProfile} />, { wrapper });

    expect(screen.getByRole('textbox', { name: i18n.t('common.name') })).toHaveValue('Existing Profile');
  });

  it('toggles the archived switch', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(<Form handleChange={handleChange} />, { wrapper });

    const archivedSwitch = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(archivedSwitch).not.toBeChecked();

    await user.click(archivedSwitch);

    expect(archivedSwitch).toBeChecked();
  });

  it.each([undefined, false, true])(
    'loads description visibility %s, emits changes, and loads another profile',
    async enabled => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      const styleProfile: StyleProfile = {
        id: 1,
        name: 'Description profile',
        isArchived: false,
        labelUpperCase: false,
        showQuantity: true,
        showUnit: true,
        showRowNo: true,
        showItemDescriptions: enabled,
        fieldSortOrders: {
          no: 0,
          item: 1,
          unit: 2,
          quantity: 3,
          unitCost: 4,
          total: 5
        },
        invoiceCount: 0,
        quotesCount: 0,
        createdAt: '',
        updatedAt: ''
      };

      const { rerender } = render(<Form styleProfile={styleProfile} handleChange={handleChange} />, { wrapper });

      await user.click(screen.getByRole('tab', { name: i18n.t('common.table') }));

      const descriptionSwitch = screen.getByRole('switch', {
        name: i18n.t('common.showItemDescriptions')
      });

      if (enabled === true) {
        expect(descriptionSwitch).toBeChecked();
      } else {
        expect(descriptionSwitch).not.toBeChecked();
      }

      await user.click(descriptionSwitch);

      await waitFor(() => {
        expect(handleChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            isFormValid: true,
            styleProfile: expect.objectContaining({
              name: 'Description profile',
              showItemDescriptions: !(enabled ?? false)
            })
          })
        );
      });

      rerender(
        <Form
          styleProfile={{
            ...styleProfile,
            id: 2,
            name: 'Another profile',
            showItemDescriptions: enabled ?? false
          }}
          handleChange={handleChange}
        />
      );

      await waitFor(() => {
        expect(handleChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            styleProfile: expect.objectContaining({
              id: 2,
              name: 'Another profile',
              showItemDescriptions: enabled ?? false
            })
          })
        );
      });

      if (enabled === true) {
        expect(descriptionSwitch).toBeChecked();
      } else {
        expect(descriptionSwitch).not.toBeChecked();
      }
    }
  );
});
