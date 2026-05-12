import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';

import { ImageDropzone } from '../src/components/image-dropzone';
import type { FileStorageProvider } from '../src/lib/file-storage';

describe('ImageDropzone', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL: jest.fn(() => 'blob:preview-image'),
        revokeObjectURL: jest.fn(),
      },
    });
  });

  function renderWithState(provider: FileStorageProvider) {
    function Wrapper() {
      const [value, setValue] = useState<string[]>([]);

      return (
        <ImageDropzone
          maxFileCount={3}
          maxFileSizeBytes={5 * 1024 * 1024}
          onChange={setValue}
          provider={provider}
          uploadContext={{ module: 'product-images', businessId: 'business-1' }}
          value={value}
        />
      );
    }

    return render(<Wrapper />);
  }

  it('shows uploading and then success state after an image upload', async () => {
    let resolveUpload:
      | ((value: {
          url: string;
          storageKey: string;
          contentType: string;
          size: number;
        }) => void)
      | undefined;
    const provider: FileStorageProvider = {
      name: 'firebase',
      uploadFile: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveUpload = resolve;
          }),
      ),
    };

    const view = renderWithState(provider);
    const input = view.container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['image'], 'product.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/subiendo/i)).toBeTruthy();

    await act(async () => {
      resolveUpload?.({
        url: 'https://cdn.example.com/product.png',
        storageKey: 'products/product.png',
        contentType: 'image/png',
        size: file.size,
      });
    });

    await waitFor(() => {
      expect(screen.getByAltText(/imagen subida 1/i)).toBeTruthy();
    });
  });

  it('shows an error and allows retry after an upload failure', async () => {
    const uploadFile = jest
      .fn()
      .mockRejectedValueOnce(new Error('Storage unavailable'))
      .mockResolvedValueOnce({
        url: 'https://cdn.example.com/retry.png',
        storageKey: 'products/retry.png',
        contentType: 'image/png',
        size: 123,
      });
    const provider: FileStorageProvider = {
      name: 'firebase',
      uploadFile,
    };

    const view = renderWithState(provider);
    const input = view.container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['image'], 'retry.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Storage unavailable')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    await waitFor(() => {
      expect(screen.getByAltText(/imagen subida 1/i)).toBeTruthy();
    });
  });
});
