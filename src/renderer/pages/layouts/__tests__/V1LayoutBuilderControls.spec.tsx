import { fireEvent, render, screen } from '@testing-library/react';
import type { LayoutSection } from '../../../shared/types/layouts';
import type { LayoutBuilderBlockNode } from '../../../shared/utils/visualBuilderV1';
import { V1LayoutBuilderControls, V1LayoutBuilderSectionControls } from '../V1LayoutBuilderControls';

const translate = (key: string) => key;

const node: LayoutBuilderBlockNode = {
  id: 'block-1',
  type: 'block',
  block: { type: 'title', width: '100%' },
  children: []
};

const section: LayoutSection = {
  type: 'header',
  visible: true
};

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

  it('updates block controls with typed values', () => {
    const onUpdate = vi.fn();
    render(<V1LayoutBuilderControls node={node} expanded onUpdate={onUpdate} t={translate} />);

    const controls = screen.getAllByRole('combobox');
    fireEvent.change(nativeInput(controls[0]), { target: { value: '50%' } });
    fireEvent.change(nativeInput(controls[1]), { target: { value: 'center' } });
    [
      { index: 2, value: '10' },
      { index: 3, value: '20' },
      { index: 4, value: '20' }
    ].forEach(({ index, value }) => {
      fireEvent.mouseDown(controls[index]);
      fireEvent.click(screen.getAllByRole('option').find(option => option.textContent === value) as HTMLElement);
    });
    fireEvent.change(nativeInput(controls[5]), { target: { value: 'bank' } });
    fireEvent.change(nativeInput(controls[6]), { target: { value: 'between' } });

    expect(onUpdate.mock.calls.map(call => call[0])).toEqual([
      { width: '50%' },
      { align: 'center' },
      { gap: 10 },
      { paddingTop: 20 },
      { paddingBottom: 20 },
      { paymentSource: 'bank' },
      { justify: 'between' }
    ]);
  });

  it('clears optional block values', () => {
    const onUpdate = vi.fn();
    const populatedNode = {
      ...node,
      block: {
        type: 'title',
        width: '50%',
        align: 'center',
        gap: 10,
        paddingTop: 20,
        paddingBottom: 20,
        paymentSource: 'bank',
        justify: 'between'
      }
    } satisfies LayoutBuilderBlockNode;
    render(<V1LayoutBuilderControls node={populatedNode} expanded onUpdate={onUpdate} t={translate} />);

    screen
      .getAllByRole('combobox')
      .slice(0, 7)
      .forEach(control => fireEvent.change(nativeInput(control), { target: { value: '' } }));
    expect(onUpdate.mock.calls.map(call => call[0])).toEqual([
      { width: undefined },
      { align: undefined },
      { gap: undefined },
      { paddingTop: undefined },
      { paddingBottom: undefined },
      { paymentSource: undefined },
      { justify: undefined }
    ]);
  });

  it('maps boolean controls to true, false, and undefined', () => {
    const onUpdate = vi.fn();
    const { rerender } = render(<V1LayoutBuilderControls node={node} expanded onUpdate={onUpdate} t={translate} />);

    const booleanControl = screen.getAllByRole('combobox')[7];
    fireEvent.change(nativeInput(booleanControl), { target: { value: 'true' } });
    fireEvent.change(nativeInput(booleanControl), { target: { value: 'false' } });

    const property = Object.keys(onUpdate.mock.calls[0][0])[0];
    rerender(
      <V1LayoutBuilderControls
        node={{ ...node, block: { type: 'title', [property]: false } }}
        expanded
        onUpdate={onUpdate}
        t={translate}
      />
    );
    fireEvent.change(nativeInput(screen.getAllByRole('combobox')[7]), { target: { value: '' } });

    expect(onUpdate.mock.calls.map(call => call[0])).toEqual([
      { [property]: true },
      { [property]: false },
      { [property]: undefined }
    ]);
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

  it('maps section false visibility and clears optional values', () => {
    const onUpdate = vi.fn();
    const populatedSection = {
      ...section,
      align: 'center',
      watermarkOrder: 'paidFirst',
      columnSizing: 'proportional'
    } satisfies LayoutSection;
    render(<V1LayoutBuilderSectionControls section={populatedSection} expanded onUpdate={onUpdate} t={translate} />);

    const controls = screen.getAllByRole('combobox');
    fireEvent.change(nativeInput(controls[0]), { target: { value: 'false' } });
    controls.slice(1).forEach(control => fireEvent.change(nativeInput(control), { target: { value: '' } }));

    expect(onUpdate.mock.calls.map(call => call[0])).toEqual([
      { visible: false },
      { align: undefined },
      { watermarkOrder: undefined },
      { columnSizing: undefined }
    ]);
  });
});
