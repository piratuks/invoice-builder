import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MenuItem } from '../../../../types/menuItem';
import { MenuList } from '../MenuList';

const makeItem = (text: string, overrides: Partial<MenuItem> = {}): MenuItem => ({
  text,
  icon: <span>{text}-icon</span>,
  isSelected: false,
  isToggle: false,
  ...overrides
});

describe('MenuList', () => {
  it('expands and collapses a group to reveal its commands', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <MenuList
        showText
        useTooltip={false}
        items={[
          {
            groupName: 'Documents',
            groupIcon: <span>documents-icon</span>,
            items: [makeItem('Invoices', { onClick }), makeItem('Quotes')]
          }
        ]}
      />
    );

    expect(screen.queryByText('Invoices')).not.toBeInTheDocument();

    await user.click(screen.getByText('Documents'));
    await user.click(screen.getByText('Invoices'));

    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ text: 'Invoices' }));

    await user.click(screen.getByText('Documents'));
    expect(screen.queryByText('Invoices')).not.toBeInTheDocument();
  });

  it('routes toggle items to onChange and command items to onClick', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const toggleClick = vi.fn();
    const onClick = vi.fn();

    render(
      <MenuList
        showText
        useTooltip
        items={[
          {
            items: [
              makeItem('Dark mode', { isToggle: true, checked: true, onChange, onClick: toggleClick }),
              makeItem('Settings', { isSelected: item => item.text === 'Settings', onClick })
            ]
          }
        ]}
      />
    );

    await user.click(screen.getByText('Dark mode'));
    await user.click(screen.getByText('Settings'));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ text: 'Dark mode' }));
    expect(toggleClick).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ text: 'Settings' }));
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('renders a one-item group directly without a group control', () => {
    render(<MenuList showText={false} useTooltip items={[{ groupName: 'Tools', items: [makeItem('Import')] }]} />);

    expect(screen.getByText('Import-icon')).toBeInTheDocument();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
  });
});
