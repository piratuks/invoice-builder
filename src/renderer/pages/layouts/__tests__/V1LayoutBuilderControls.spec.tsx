import { fireEvent, render, screen } from '@testing-library/react';
import { V1LayoutBuilderControls, V1LayoutBuilderSectionControls } from '../V1LayoutBuilderControls';

const translate = (key: string) => key;

const node = {
  id: 'block-1',
  block: { type: 'text', width: '100%' }
} as never;

const section = {
  id: 'section-1',
  visible: true
} as never;

const nativeInput = (control: HTMLElement) => {
  const input = control.parentElement?.querySelector('input');
  if (!input) throw new Error('Expected MUI select input');
  return input;
};

describe('V1 layout builder controls', () => {
  it('does not render collapsed controls', () => {
    const { container } = render(
      <>
        <V1LayoutBuilderControls node={node} expanded={false} onUpdate={vi.fn()} t={translate} />
        <V1LayoutBuilderSectionControls section={section} expanded={false} onUpdate={vi.fn()} t={translate} />
      </>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('updates block and boolean controls', () => {
    const onUpdate = vi.fn();
    render(<V1LayoutBuilderControls node={node} expanded onUpdate={onUpdate} t={translate} />);

    const controls = screen.getAllByRole('combobox');
    controls.forEach((control, index) => {
      fireEvent.change(nativeInput(control), {
        target: { value: index % 2 === 0 ? 'true' : '' }
      });
    });

    expect(onUpdate).toHaveBeenCalled();
    expect(onUpdate.mock.calls.length).toBeGreaterThan(0);
  });

  it('updates section visibility, alignment, watermark, and sizing', () => {
    const onUpdate = vi.fn();
    render(<V1LayoutBuilderSectionControls section={section} expanded onUpdate={onUpdate} t={translate} />);

    const controls = screen.getAllByRole('combobox');
    fireEvent.change(nativeInput(controls[0]), { target: { value: 'auto' } });
    fireEvent.change(nativeInput(controls[1]), { target: { value: 'center' } });
    fireEvent.change(nativeInput(controls[2]), { target: { value: 'paidFirst' } });
    fireEvent.change(nativeInput(controls[3]), { target: { value: 'proportional' } });

    expect(onUpdate).toHaveBeenNthCalledWith(1, { visible: 'auto' });
    expect(onUpdate).toHaveBeenNthCalledWith(2, { align: 'center' });
    expect(onUpdate).toHaveBeenNthCalledWith(3, { watermarkOrder: 'paidFirst' });
    expect(onUpdate).toHaveBeenNthCalledWith(4, { columnSizing: 'proportional' });
  });
});
