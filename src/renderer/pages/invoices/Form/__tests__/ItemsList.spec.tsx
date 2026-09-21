import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { AmountFormat } from '../../../../shared/enums/amountFormat';
import { DateFormat } from '../../../../shared/enums/dateFormat';
import { InvoiceType } from '../../../../shared/enums/invoiceType';
import { Language } from '../../../../shared/enums/language';
import type { InvoiceFromData, InvoiceItem } from '../../../../shared/types/invoice';
import { store } from '../../../../state/configureStore';
import { setSettings } from '../../../../state/pageSlice';
import { ItemsList } from '../ItemsList';

const dragEnd = vi.fn();

vi.mock('@dnd-kit/core', () => ({
  closestCenter: {},
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (event: unknown) => void }) => (
    <div>
      <button
        type="button"
        onClick={() => onDragEnd({ active: { id: 'invoice-item-2-0' }, over: { id: 'invoice-item-1-1' } })}
      >
        reorder-items
      </button>
      {children}
    </div>
  ),
  PointerSensor: class {},
  useSensor: () => ({}),
  useSensors: () => []
}));
vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: (items: InvoiceItem[], from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  },
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: {}
}));
vi.mock('../../../../shared/components/lists/sortableItem/SortableItem', () => ({
  SortableItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const items = [
  {
    id: 1,
    itemId: 1,
    quantity: '2',
    taxRate: 20,
    taxType: 'exclusive',
    customField: { header: 'Code', value: 'A1', alignment: 'left', sortOrder: 1 },
    invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Item A', unitPriceCents: '100' }
  },
  {
    id: 2,
    itemId: 2,
    quantity: '1',
    taxRate: 0,
    invoiceItemSnapshot: { parentInvoiceItemId: 2, itemName: 'Item B', unitPriceCents: '200' }
  }
] as unknown as InvoiceItem[];

const invoice = {
  invoiceType: InvoiceType.invoice,
  invoiceItems: items,
  invoicePayments: [],
  discountAmountCents: '0',
  shippingFeeCents: '0',
  surchargeAmountCents: '0',
  taxRate: 0,
  invoiceCurrencySnapshot: { currencyCode: 'USD', currencySymbol: '$', currencySubunit: 100 }
} as unknown as InvoiceFromData;

describe('ItemsList', () => {
  beforeEach(() => {
    dragEnd.mockClear();
    store.dispatch(
      setSettings({
        id: 1,
        language: Language.en,
        amountFormat: AmountFormat.enUS,
        dateFormat: DateFormat.MMddyyyy,
        isDarkMode: false,
        shouldIncludeYear: false,
        shouldIncludeMonth: false,
        shouldIncludeBusinessName: false,
        quotesON: true,
        styleProfilesON: false,
        ublON: false,
        xrechnungON: false,
        receiptPrintingOn: false,
        presetsON: false,
        reportsON: false,
        createdAt: '',
        updatedAt: ''
      })
    );
  });

  it('opens item actions and routes edit/remove callbacks', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ItemsList invoiceForm={invoice} onEdit={onEdit} onDelete={onDelete} />, { wrapper });

    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText(/Code: A1/)).toBeInTheDocument();
    await user.click(screen.getAllByTestId('MoreVertIcon')[0].parentElement!);
    await user.click(screen.getByRole('menuitem', { name: /edit/i }));
    await user.click(screen.getAllByTestId('MoreVertIcon')[0].parentElement!);
    await user.click(screen.getByRole('menuitem', { name: /remove/i }));

    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });

  it('reorders items through the drag-end handler', async () => {
    const user = userEvent.setup();
    const setInvoiceForm = vi.fn();
    render(<ItemsList invoiceForm={invoice} setInvoiceForm={setInvoiceForm} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /reorder-items/i }));

    expect(setInvoiceForm).toHaveBeenCalledWith(expect.objectContaining({ invoiceItems: [items[1], items[0]] }));
  });
});
