import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../../i18n';
import { toDataUrl } from '../../../../utils/dataUrlFunctions';
import { CropModal } from '../CropModal';

vi.mock('../../../../utils/dataUrlFunctions', () => ({ toDataUrl: vi.fn() }));
vi.mock('react-image-crop', () => ({
  default: ({
    children,
    onChange
  }: {
    children: ReactNode;
    onChange: (crop: { unit: 'px' | '%'; x: number; y: number; width: number; height: number }) => void;
  }) => (
    <div>
      {children}
      <button type="button" onClick={() => onChange({ unit: 'px', x: 10, y: 5, width: 20, height: 10 })}>
        pixel-crop
      </button>
      <button type="button" onClick={() => onChange({ unit: '%', x: 0, y: 0, width: 0, height: 0 })}>
        empty-crop
      </button>
    </div>
  )
}));

const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;

describe('CropModal', () => {
  const drawImage = vi.fn();
  const clearRect = vi.fn();
  const context = { drawImage, clearRect } as unknown as CanvasRenderingContext2D;
  let getContext: ReturnType<typeof vi.spyOn>;
  let toBlob: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toDataUrl).mockResolvedValue('data:cropped');
    getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
    toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => {
      callback(new Blob(['crop'], { type: 'image/png' }));
    });
  });

  afterEach(() => {
    getContext.mockRestore();
    toBlob.mockRestore();
  });

  const setImageDimensions = () => {
    const image = screen.getByRole('img', { name: i18n.t('common.crop') });
    Object.defineProperties(image, {
      width: { configurable: true, value: 200 },
      height: { configurable: true, value: 100 },
      naturalWidth: { configurable: true, value: 400 },
      naturalHeight: { configurable: true, value: 200 }
    });
  };

  it('does not mount content while closed and calls close from the back button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<CropModal isOpen={false} imageSrc="data:image" onClose={onClose} />, { wrapper });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <CropModal isOpen imageSrc="data:image" onClose={onClose} />
      </I18nextProvider>
    );
    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.back') }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('crops percentage coordinates and saves the generated PNG', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<CropModal isOpen imageSrc="data:image" onSave={onSave} />, { wrapper });
    setImageDimensions();

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('data:cropped', expect.any(Blob)));
    expect(clearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(drawImage).toHaveBeenCalledWith(expect.any(HTMLImageElement), 0, 0, 200, 100, 0, 0, 200, 100);
  });

  it('crops pixel coordinates and resets the crop when the source changes', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const { rerender } = render(<CropModal isOpen imageSrc="first" onSave={onSave} />, { wrapper });
    setImageDimensions();
    await user.click(screen.getByRole('button', { name: 'pixel-crop' }));
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    await waitFor(() =>
      expect(drawImage).toHaveBeenCalledWith(expect.any(HTMLImageElement), 20, 10, 40, 20, 0, 0, 40, 20)
    );

    rerender(
      <I18nextProvider i18n={i18n}>
        <CropModal isOpen imageSrc="second" onSave={onSave} />
      </I18nextProvider>
    );
    setImageDimensions();
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(drawImage).toHaveBeenLastCalledWith(expect.any(HTMLImageElement), 0, 0, 200, 100, 0, 0, 200, 100);
  });

  it('skips saving for an empty crop, missing canvas context, or failed blob creation', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<CropModal isOpen imageSrc="data:image" onSave={onSave} />, { wrapper });
    setImageDimensions();

    await user.click(screen.getByRole('button', { name: 'empty-crop' }));
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    expect(onSave).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'pixel-crop' }));
    getContext.mockReturnValue(null);
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    expect(onSave).not.toHaveBeenCalled();

    getContext.mockReturnValue(context);
    toBlob.mockImplementation((callback: BlobCallback) => callback(null));
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    expect(onSave).not.toHaveBeenCalled();
  });
});
