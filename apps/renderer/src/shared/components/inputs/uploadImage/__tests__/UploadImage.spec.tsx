import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../../i18n';
import { useAppDispatch } from '../../../../../state/configureStore';
import { toDataUrl } from '../../../../utils/dataUrlFunctions';
import { UploadImage } from '../UploadImage';

vi.mock('../../../../../state/configureStore', () => ({ useAppDispatch: vi.fn() }));
vi.mock('../../../../utils/dataUrlFunctions', () => ({ toDataUrl: vi.fn() }));
vi.mock('../../../modals/cropModal/CropModal', () => ({
  CropModal: ({
    isOpen,
    imageSrc,
    onClose,
    onSave
  }: {
    isOpen: boolean;
    imageSrc?: string;
    onClose: () => void;
    onSave: (url: string, file: Blob) => void;
  }) =>
    isOpen ? (
      <div role="dialog">
        <span>{imageSrc}</span>
        <button type="button" onClick={onClose}>
          close-crop
        </button>
        <button type="button" onClick={() => onSave('data:cropped', new Blob(['cropped'], { type: 'image/png' }))}>
          save-crop
        </button>
      </div>
    ) : null
}));

const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;

describe('UploadImage', () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    vi.mocked(toDataUrl).mockResolvedValue('data:original');
  });

  it('renders an existing image and clears it without reopening the picker', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    render(<UploadImage imgUrl="data:existing" onUpload={onUpload} />, { wrapper });
    const input = screen.getByTitle(i18n.t('common.selectImage')) as HTMLInputElement;
    const inputClick = vi.spyOn(input, 'click');

    expect(screen.getByRole('img', { name: i18n.t('ariaLabel.cropped') })).toHaveAttribute('src', 'data:existing');
    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.clear') }));

    expect(onUpload).toHaveBeenCalledWith(undefined);
    expect(inputClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: i18n.t('ariaLabel.uploadImage') })).toBeInTheDocument();
  });

  it('respects edit, clear, and always-add display controls', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<UploadImage imgUrl="data:existing" disableEdit disableClear />, { wrapper });
    const input = screen.getByTitle(i18n.t('common.selectImage')) as HTMLInputElement;
    const inputClick = vi.spyOn(input, 'click');

    await user.click(screen.getByRole('img', { name: i18n.t('ariaLabel.cropped') }));
    expect(inputClick).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: i18n.t('ariaLabel.clear') })).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <UploadImage imgUrl="data:existing" alwaysShowAddIcon />
      </I18nextProvider>
    );
    expect(screen.queryByRole('img', { name: i18n.t('ariaLabel.cropped') })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('ariaLabel.uploadImage') })).toBeInTheDocument();
  });

  it('ignores an empty file change and reports an oversized file', () => {
    render(<UploadImage maxSizeMB={1} />, { wrapper });
    const input = screen.getByTitle(i18n.t('common.selectImage')) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [] } });
    expect(toDataUrl).not.toHaveBeenCalled();

    const largeFile = new File([new Uint8Array(1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [largeFile] } });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ message: expect.stringContaining('1MB'), severity: 'error' })
      })
    );
    expect(input.value).toBe('');
    expect(toDataUrl).not.toHaveBeenCalled();
  });

  it('opens the cropper for a valid file, closes it, and saves the original filename', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    render(<UploadImage onUpload={onUpload} />, { wrapper });
    const input = screen.getByTitle(i18n.t('common.selectImage')) as HTMLInputElement;
    const file = new File(['image'], 'invoice-logo.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole('dialog')).toHaveTextContent('data:original');
    await user.click(screen.getByRole('button', { name: 'close-crop' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { files: [file] } });
    await user.click(await screen.findByRole('button', { name: 'save-crop' }));
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(expect.any(Blob), 'invoice-logo.png'));
    expect(screen.getByRole('img', { name: i18n.t('ariaLabel.cropped') })).toHaveAttribute('src', 'data:cropped');
    expect(input.value).toBe('');
  });

  it('opens the native picker when the upload area is clicked', async () => {
    const user = userEvent.setup();
    render(<UploadImage />, { wrapper });
    const input = screen.getByTitle(i18n.t('common.selectImage')) as HTMLInputElement;
    const inputClick = vi.spyOn(input, 'click');

    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.uploadImage') }));
    expect(inputClick).toHaveBeenCalled();
  });
});
