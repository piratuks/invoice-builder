import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef, useImperativeHandle } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../../i18n';
import { toDataUrl, toUint8Array } from '../../../../../shared/utils/dataUrlFunctions';
import { SignatureDropdown } from '../SignatureDropdown';

const clear = vi.fn();
const fromDataURL = vi.fn();
const toBlob = vi.fn((callback: BlobCallback) => callback(new Blob(['signature'], { type: 'image/png' })));
const getCanvas = vi.fn(() => ({ width: 300, height: 200, toBlob, toDataURL: () => 'data:image/png;base64,c2ln' }));
let isEmpty = false;

vi.mock('react-signature-canvas', () => ({
  default: forwardRef((_props, ref) => {
    useImperativeHandle(ref, () => ({ clear, fromDataURL, getCanvas, isEmpty: () => isEmpty }));
    return <div data-testid="signature-canvas" />;
  })
}));

vi.mock('../../../../../shared/components/controls/uploadButton/UploadButton', () => ({
  UploadButton: ({ onUpload }: { onUpload: (file?: Blob, filename?: string) => void }) => (
    <button type="button" onClick={() => onUpload(new Blob(['upload'], { type: 'image/jpeg' }), 'uploaded.jpg')}>
      Upload test signature
    </button>
  )
}));

vi.mock('../../../../../shared/utils/dataUrlFunctions', () => ({
  toDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,c2ln'),
  toUint8Array: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('SignatureDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isEmpty = false;
  });

  it('saves a drawn signature and clears the canvas', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<SignatureDropdown isOpen={true} form={{}} onClick={onClick} />, { wrapper });

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() =>
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({ data: new Uint8Array([1, 2, 3]), size: 9, type: 'image/png', name: 'signature.png' })
      )
    );
    expect(toUint8Array).toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
  });

  it('does not save an empty canvas and supports the clear action', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    isEmpty = true;

    render(<SignatureDropdown isOpen={true} form={{}} onClick={onClick} />, { wrapper });

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));
    await user.click(screen.getByRole('button', { name: i18n.t('ariaLabel.clear') }));

    expect(onClick).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
  });

  it('converts an uploaded signature and reloads existing signature data', async () => {
    const user = userEvent.setup();

    render(
      <SignatureDropdown
        isOpen={true}
        form={{ data: new Uint8Array([9]), size: 1, type: 'image/png', name: 'existing.png' }}
      />,
      { wrapper }
    );

    await waitFor(() => expect(toDataUrl).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'Upload test signature' }));

    await waitFor(() => expect(toUint8Array).toHaveBeenCalledWith(expect.anything(), expect.any(Blob)));
  });
});
