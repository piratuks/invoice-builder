import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../../i18n';
import { GenericList } from '../GenericList';

let isMobile = false;

vi.mock('../../../../../state/configureStore', () => ({
  useAppSelector: () => ({ quotesON: true })
}));

interface Entity {
  id: number;
  name: string;
  archived: boolean;
}

const item: Entity = { id: 3, name: 'Acme Ltd', archived: true };

const renderList = (overrides: Partial<React.ComponentProps<typeof GenericList<Entity>>> = {}) => {
  const props: React.ComponentProps<typeof GenericList<Entity>> = {
    item,
    selectedItem: item,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onExport: vi.fn(),
    getShortName: () => 'AL',
    getName: value => value.name,
    getAdditional: () => 'Preferred client',
    getEmail: () => 'billing@acme.test',
    getPhone: () => '+1 555 0100',
    getInvoiceCount: () => 2,
    getQuotesCount: () => 1,
    getIsArchived: value => value.archived,
    ...overrides
  };

  render(
    <I18nextProvider i18n={i18n}>
      <GenericList {...props} />
    </I18nextProvider>
  );

  return props;
};

describe('GenericList', () => {
  beforeAll(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width') ? isMobile : !isMobile,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  beforeEach(() => {
    isMobile = false;
  });

  it('renders details and keeps export and delete clicks from opening edit', async () => {
    const user = userEvent.setup();
    const props = renderList();

    expect(screen.getByText('Acme Ltd')).toBeInTheDocument();
    expect(screen.getByText('Preferred client')).toBeInTheDocument();
    expect(screen.getByText('billing@acme.test')).toBeInTheDocument();
    expect(screen.getByText('+1 555 0100')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('common.archived').toUpperCase())).toBeInTheDocument();
    expect(screen.getByText(`2 ${i18n.t('common.invoices')}`)).toBeInTheDocument();
    expect(screen.getByText(`1 ${i18n.t('common.quote')}`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: i18n.t('common.export') }));
    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.delete') }));

    expect(props.onExport).toHaveBeenCalledTimes(1);
    expect(props.onDelete).toHaveBeenCalledWith(item.id);
    expect(props.onEdit).not.toHaveBeenCalled();

    await user.click(screen.getByText('Acme Ltd'));
    expect(props.onEdit).toHaveBeenCalledWith(item);
  });

  it('uses the compact mobile count sentence', () => {
    isMobile = true;
    renderList({ showDeleteButton: false, onExport: undefined });

    expect(screen.getByText(`2 ${i18n.t('common.invoices')}`)).toBeInTheDocument();
    expect(screen.getByText(i18n.t('common.and'))).toBeInTheDocument();
    expect(screen.getByText(`1 ${i18n.t('common.quote')}`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: i18n.t('ariaLabel.delete') })).not.toBeInTheDocument();
  });
});
