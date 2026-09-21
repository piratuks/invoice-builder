import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../../../i18n';
import { Alignment } from '../../../../../enums/alignment';
import { PageFormat } from '../../../../../enums/pageFormat';
import { SizeType } from '../../../../../enums/sizeType';
import { TableHeaderStyle } from '../../../../../enums/tableHeaderStyle';
import { TableRowStyle } from '../../../../../enums/tableRowStyle';
import { toDataUrl, toUint8Array } from '../../../../../utils/dataUrlFunctions';
import { BrandingTab } from '../BrandingTab';
import { PageSetupTab } from '../PageSetupTab';
import { TableTab } from '../TableTab';

const layouts = [
  {
    id: 1,
    isArchived: false,
    schema: { schemaVersion: 1 as const, meta: { name: 'Classic layout' } },
    invoiceCount: 0,
    quotesCount: 0,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 2,
    isArchived: true,
    schema: { schemaVersion: 1 as const, meta: { name: 'Archived layout' } },
    invoiceCount: 0,
    quotesCount: 0,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 3,
    isArchived: false,
    schema: { schemaVersion: 1 as const, meta: { name: 'Modern layout' } },
    invoiceCount: 0,
    quotesCount: 0,
    createdAt: '',
    updatedAt: ''
  }
];

vi.mock('../../../../../hooks/layouts/useLayoutsRetrieve', () => ({
  useLayoutsRetrieve: () => ({ layouts })
}));

vi.mock('../../../../../utils/dataUrlFunctions', () => ({
  toDataUrl: vi.fn(),
  toUint8Array: vi.fn()
}));

vi.mock('mui-color-input', () => ({
  MuiColorInput: ({
    value,
    label,
    onChange
  }: {
    value: string;
    label: string;
    onChange: (event: unknown, value: string | { hex: string }) => void;
  }) => (
    <div>
      <input aria-label={label} value={value} onChange={event => onChange(event, event.target.value)} />
      <button type="button" onClick={() => onChange(undefined, { hex: '#abcdef' })}>
        object-color
      </button>
    </div>
  )
}));

vi.mock('../../../../inputs/uploadImage/UploadImage', () => ({
  UploadImage: ({ onUpload, imgUrl }: { onUpload: (file?: Blob, filename?: string) => void; imgUrl?: string }) => (
    <div data-testid="upload-image">
      <span>{imgUrl ?? 'no-image'}</span>
      <button type="button" onClick={() => onUpload(new Blob(['image'], { type: 'image/png' }), 'mark.png')}>
        upload
      </button>
      <button type="button" onClick={() => onUpload()}>
        clear
      </button>
    </div>
  )
}));

vi.mock('@dnd-kit/core', () => ({
  PointerSensor: class PointerSensor {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  DndContext: ({ children, onDragEnd }: { children: ReactNode; onDragEnd: (event: unknown) => void }) => (
    <div>
      {children}
      <button
        type="button"
        onClick={() =>
          onDragEnd({
            active: { id: 'customizable-sort-order-item-1' },
            over: { id: 'customizable-sort-order-total-5' }
          })
        }
      >
        reorder
      </button>
      <button
        type="button"
        onClick={() =>
          onDragEnd({
            active: { id: 'customizable-sort-order-item-1' },
            over: { id: 'customizable-sort-order-item-1' }
          })
        }
      >
        unchanged-order
      </button>
    </div>
  )
}));

vi.mock('@dnd-kit/sortable', async importOriginal => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    SortableContext: ({ children }: { children: ReactNode }) => <>{children}</>,
    verticalListSortingStrategy: vi.fn()
  };
});

vi.mock('../../../../lists/sortableItem/SortableItem', () => ({
  SortableItem: ({ children }: { children: ReactNode }) => <>{children}</>
}));

const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;

describe('customization tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toUint8Array).mockResolvedValue(new Uint8Array([1, 2, 3]));
    vi.mocked(toDataUrl).mockResolvedValue('data:image/png;base64,converted');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates page format, layout, font size, and font family', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PageSetupTab
        value={0}
        data={{ pageFormat: PageFormat.a4, layoutId: 1, fontSize: SizeType.small, fontFamily: 'Roboto' as never }}
        onChange={onChange}
      />,
      { wrapper }
    );

    await user.click(screen.getByRole('radio', { name: i18n.t('common.letter') }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ pageFormat: PageFormat.letter }))
    );

    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[0]);
    expect(screen.queryByText('Archived layout')).not.toBeInTheDocument();
    await user.click(await screen.findByText('Modern layout'));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ layoutId: 3, layoutSchema: layouts[2].schema })
      )
    );

    await user.click(screen.getByRole('radio', { name: i18n.t('common.large') }));
    await user.click(comboboxes[1]);
    await user.click(await screen.findByText('Courier'));

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ fontSize: SizeType.large, fontFamily: 'Courier' })
      )
    );
  });

  it('synchronizes page setup data and hides inactive content', () => {
    const { rerender } = render(<PageSetupTab value={1} data={{ pageFormat: PageFormat.a4 }} />, { wrapper });
    expect(screen.queryByRole('radio', { name: 'A4' })).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <PageSetupTab value={0} data={{ pageFormat: PageFormat.letter }} />
      </I18nextProvider>
    );
    expect(screen.getByRole('radio', { name: i18n.t('common.letter') })).toBeChecked();
  });

  it('debounces branding color changes and supports both color callback shapes', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { unmount } = render(<BrandingTab value={1} data={{ color: '#000000' }} onChange={onChange} />, { wrapper });

    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('common.color') }), {
      target: { value: '#123456' }
    });
    expect(onChange).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(150));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ color: '#123456' }));

    fireEvent.click(screen.getByRole('button', { name: 'object-color' }));
    await act(() => vi.advanceTimersByTimeAsync(150));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ color: '#abcdef' }));

    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('common.color') }), {
      target: { value: '#fedcba' }
    });
    unmount();
  });

  it('uploads, previews, clears both watermarks, and changes logo size', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <BrandingTab
        value={1}
        data={{
          logoSize: SizeType.small,
          watermarkFileData: new Uint8Array([9]),
          watermarkFileType: 'image/png',
          paidWatermarkFileData: new Uint8Array([8]),
          paidWatermarkFileType: 'image/png'
        }}
        onChange={onChange}
      />,
      { wrapper }
    );

    await waitFor(() => expect(toDataUrl).toHaveBeenCalledTimes(2));
    const uploads = screen.getAllByTestId('upload-image');
    await waitFor(() => expect(within(uploads[0]).getByText('data:image/png;base64,converted')).toBeInTheDocument());

    await user.click(within(uploads[0]).getByRole('button', { name: 'upload' }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          watermarkFileData: new Uint8Array([1, 2, 3]),
          watermarkFileName: 'mark.png',
          watermarkFileType: 'image/png'
        })
      )
    );

    await user.click(within(uploads[1]).getByRole('button', { name: 'upload' }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ paidWatermarkFileName: 'mark.png' }))
    );
    await user.click(within(uploads[0]).getByRole('button', { name: 'clear' }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ watermarkFileData: undefined }))
    );
    await user.click(within(uploads[1]).getByRole('button', { name: 'clear' }));
    await user.click(screen.getByRole('radio', { name: i18n.t('common.medium') }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ logoSize: SizeType.medium }))
    );
  });

  it('does not update a watermark when conversion fails', async () => {
    vi.mocked(toUint8Array).mockResolvedValue(null);
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BrandingTab value={1} onChange={onChange} />, { wrapper });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({}));
    const callsBeforeUpload = onChange.mock.calls.length;

    await user.click(within(screen.getAllByTestId('upload-image')[0]).getByRole('button', { name: 'upload' }));
    expect(toUint8Array).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(callsBeforeUpload);
  });

  it('updates table styles, toggles optional columns, and emits reordered fields', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TableTab
        value={2}
        data={{
          tableHeaderStyle: TableHeaderStyle.light,
          tableRowStyle: TableRowStyle.classic,
          showQuantity: false,
          showRowNo: false,
          showUnit: false,
          fieldSortOrders: { no: 0, item: 1, unit: 2, quantity: 3, unitCost: 4, total: 5 },
          customField: [{ header: 'Reference', value: 'PO-1', alignment: Alignment.left, sortOrder: 6 }]
        }}
        onChange={onChange}
      />,
      { wrapper }
    );

    expect(screen.queryByText(i18n.t('common.tableRowNo'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t('invoices.quantity'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t('common.unit'))).not.toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: i18n.t('common.dark') }));
    await user.click(screen.getByRole('radio', { name: i18n.t('common.bordered') }));
    const switches = screen.getAllByRole('switch');
    await user.click(switches[0]);
    await user.click(switches[1]);
    await user.click(switches[2]);

    expect(screen.getByText(i18n.t('common.tableRowNo'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('invoices.quantity'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('common.unit'))).toBeInTheDocument();

    const callsBeforeNoop = onChange.mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'unchanged-order' }));
    expect(onChange).toHaveBeenCalledTimes(callsBeforeNoop);
    await user.click(screen.getByRole('button', { name: 'reorder' }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ fieldSortOrders: expect.objectContaining({ item: 5, total: 4, Reference: 6 }) })
      )
    );
  });

  it('renders no sortable fields when field ordering is absent', () => {
    render(<TableTab value={2} data={{ showQuantity: true, showRowNo: true, showUnit: true }} />, { wrapper });
    expect(screen.queryByLabelText(i18n.t('ariaLabel.dragToSort'))).not.toBeInTheDocument();
  });
});
