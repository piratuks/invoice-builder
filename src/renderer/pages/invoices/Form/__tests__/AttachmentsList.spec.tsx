import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import type { InvoiceFromData } from '../../../../shared/types/invoice';
import { store } from '../../../../state/configureStore';
import { AttachmentsList } from '../AttachmentsList';

vi.mock('../../../../shared/utils/dataUrlFunctions', () => ({
  toDataUrl: vi.fn().mockResolvedValue('attachment-url'),
  toUint8Array: vi.fn().mockResolvedValue(new Uint8Array([1, 2]))
}));

vi.mock('../../../../shared/components/inputs/uploadImage/UploadImage', () => ({
  UploadImage: ({
    onUpload,
    imgUrl,
    alwaysShowAddIcon
  }: {
    onUpload: (file?: Blob, filename?: string) => void;
    imgUrl?: string;
    alwaysShowAddIcon?: boolean;
  }) => (
    <button
      type="button"
      data-testid={alwaysShowAddIcon ? 'add-attachment' : `attachment-${imgUrl}`}
      onClick={() => (alwaysShowAddIcon ? onUpload(new Blob(['file'], { type: 'text/plain' }), 'new.txt') : onUpload())}
    >
      {alwaysShowAddIcon ? 'add-attachment' : 'clear-attachment'}
    </button>
  )
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const invoice = {
  invoiceAttachments: [{ id: 4, fileName: 'old.txt', fileType: 'text/plain', fileSize: 2, data: new Uint8Array([1]) }]
} as unknown as InvoiceFromData;

describe('AttachmentsList', () => {
  it('renders existing attachments and clears one', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<AttachmentsList invoiceForm={invoice} onAttach={vi.fn()} onClear={onClear} />, { wrapper });

    await user.click(await screen.findByRole('button', { name: /clear-attachment/i }));
    expect(onClear).toHaveBeenCalledWith(4);
  });

  it('converts a newly uploaded file and forwards attachment data', async () => {
    const user = userEvent.setup();
    const onAttach = vi.fn();
    render(<AttachmentsList onAttach={onAttach} onClear={vi.fn()} />, { wrapper });

    const upload = screen.getByTestId('add-attachment');
    await user.click(upload);

    expect(await vi.waitFor(() => onAttach.mock.calls.length)).toBe(1);
    expect(onAttach).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'new.txt', fileType: 'text/plain', fileSize: 4 })
    );
  });
});
