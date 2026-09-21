import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { InvoiceType } from '../../../../shared/enums/invoiceType';
import { Language } from '../../../../shared/enums/language';
import type { InvoiceFromData } from '../../../../shared/types/invoice';
import { store } from '../../../../state/configureStore';
import { InvoicesPreview } from '../index';

const exportPdf = vi.fn();
const printReceipt = vi.fn();

type MockCustomizationProps = {
  isOpen: boolean;
  onClick: (data: Record<string, unknown>) => void;
  onSaveProfile: (data: { name: string }) => void;
};

vi.mock('../../../../shared/hooks/fileExport/useExportPdf', () => ({
  useExportPdf: () => ({ exportPdf }),
  getAttachmentsUrl: vi.fn().mockResolvedValue([]),
  getLogoUrl: vi.fn().mockResolvedValue(undefined),
  getQRCodeUrls: vi.fn().mockResolvedValue(undefined),
  getSignatureUrls: vi.fn().mockResolvedValue(undefined),
  getWatermarkPaidUrl: vi.fn().mockResolvedValue(undefined),
  getWatermarkUrl: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../../shared/hooks/print/usePrintReceipt', () => ({
  usePrintReceipt: () => ({ printReceipt })
}));

vi.mock('../PreviewCore', () => ({
  PreviewCore: () => <div data-testid="preview-core" />
}));

vi.mock('../Dropdowns/CustomizationDropdown', () => ({
  CustomizationDropdown: ({ isOpen, onClick, onSaveProfile }: MockCustomizationProps) =>
    isOpen ? (
      <div>
        <button
          type="button"
          onClick={() =>
            onClick({
              layoutId: 8,
              layoutSchema: { version: 2 },
              color: '#123456',
              fieldSortOrders: { custom: 4 }
            })
          }
        >
          apply-customization
        </button>
        <button type="button" onClick={() => onSaveProfile({ name: 'Saved profile' })}>
          save-profile
        </button>
      </div>
    ) : null
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const baseForm = {
  id: 1,
  invoiceType: InvoiceType.invoice,
  language: Language.en,
  layoutId: 1,
  invoiceItems: [
    {
      id: 1,
      itemId: 1,
      quantity: '1',
      taxRate: 0,
      customField: { header: 'custom', value: 'Value', alignment: 'left', sortOrder: 1 },
      invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Item', unitPriceCents: '100' }
    }
  ],
  invoiceCustomization: {
    color: '#000000',
    fieldSortOrders: { custom: 1 },
    showQuantity: true,
    showUnit: true,
    showRowNo: true
  },
  invoiceLayoutSnapshot: { layoutSchema: { version: 1 } }
} as unknown as InvoiceFromData;

function PreviewHarness({ invoiceForm = baseForm }: { invoiceForm?: InvoiceFromData }) {
  const [currentForm, setCurrentForm] = useState<InvoiceFromData | undefined>(invoiceForm);
  const [savedProfile, setSavedProfile] = useState('none');

  return (
    <>
      <div data-testid="layout-id">{currentForm?.layoutId}</div>
      <div data-testid="color">{currentForm?.invoiceCustomization?.color}</div>
      <div data-testid="saved-profile">{savedProfile}</div>
      <InvoicesPreview
        invoiceForm={currentForm}
        setInvoiceForm={setCurrentForm}
        onSaveProfile={profile => setSavedProfile(profile.name)}
      />
    </>
  );
}

describe('InvoicesPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the preview and invokes PDF and receipt actions', async () => {
    const user = userEvent.setup();
    render(<PreviewHarness />, { wrapper });

    expect(screen.getByTestId('preview-core')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /export pdf/i }));
    await user.click(screen.getByRole('button', { name: /print receipt/i }));

    expect(exportPdf).toHaveBeenCalledTimes(1);
    expect(printReceipt).toHaveBeenCalledTimes(1);
  });

  it('applies customization and forwards saved profiles', async () => {
    const user = userEvent.setup();
    render(<PreviewHarness />, { wrapper });

    await user.click(screen.getByRole('button', { name: /customize/i }));
    await user.click(screen.getByRole('button', { name: /apply-customization/i }));
    await user.click(screen.getByRole('button', { name: /save-profile/i }));

    expect(screen.getByTestId('layout-id')).toHaveTextContent('8');
    expect(screen.getByTestId('color')).toHaveTextContent('#123456');
    expect(screen.getByTestId('saved-profile')).toHaveTextContent('Saved profile');
  });

  it('does not render receipt printing for quotations', async () => {
    render(<PreviewHarness invoiceForm={{ ...baseForm, invoiceType: InvoiceType.quotation }} />, { wrapper });

    expect(screen.queryByRole('button', { name: /print receipt/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
  });
});
