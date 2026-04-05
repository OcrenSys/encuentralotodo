import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';

import { ProductUpsertDialog } from '../src/modules/products/product-create-dialog';

const invalidateMock = jest.fn(async () => undefined);
const createProductMutateMock = jest.fn();
const updateProductMutateMock = jest.fn();

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('ui', () => {
  const actual = jest.requireActual('ui');
  const { useEffect } = jest.requireActual('react') as typeof import('react');

  return {
    ...actual,
    Button: ({ children, ...props }: ComponentProps<'button'>) => (
      <button {...props}>{children}</button>
    ),
    Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
      open ? <div>{children}</div> : null,
    DialogContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    DialogDescription: ({ children }: { children: ReactNode }) => (
      <p>{children}</p>
    ),
    DialogFooter: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    DialogHeader: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
    Select: ({
      options,
      value,
      placeholder,
      onValueChange,
      'aria-label': ariaLabel,
      disabled,
    }: {
      options: Array<{ label: string; value: string }>;
      value?: string;
      placeholder?: string;
      onValueChange?: (value: string) => void;
      'aria-label'?: string;
      disabled?: boolean;
    }) => {
      useEffect(() => {
        if (value || !onValueChange) {
          return;
        }

        const nextValue = options.find((option) => option.value)?.value;

        if (nextValue) {
          onValueChange(nextValue);
        }
      }, [onValueChange, options, value]);

      return (
        <select
          aria-label={ariaLabel ?? placeholder}
          disabled={disabled}
          onChange={(event) => onValueChange?.(event.target.value)}
          value={value}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    },
  };
});

jest.mock('../src/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({
      product: {
        managed: {
          invalidate: invalidateMock,
        },
      },
      business: {
        managed: {
          invalidate: invalidateMock,
        },
        managedPage: {
          invalidate: invalidateMock,
        },
      },
    }),
    product: {
      create: {
        useMutation: jest.fn(),
      },
      update: {
        useMutation: jest.fn(),
      },
    },
  },
}));

jest.mock('../src/lib/file-storage', () => ({
  getFileStorageProvider: () => ({
    name: 'firebase',
    uploadFile: jest.fn(),
  }),
}));

jest.mock('../src/components/image-dropzone', () => ({
  ImageDropzone: ({
    onChange,
    value,
  }: {
    onChange: (images: string[]) => void;
    value: string[];
  }) => (
    <div>
      <p>Imagenes actuales: {value.join(', ') || 'sin imagenes'}</p>
      <button
        onClick={() =>
          onChange(['https://cdn.example.com/products/new-product.png'])
        }
        type="button"
      >
        Subir imagen de producto
      </button>
    </div>
  ),
}));

const { trpc } = jest.requireMock('../src/lib/trpc') as {
  trpc: {
    product: {
      create: { useMutation: jest.Mock };
      update: { useMutation: jest.Mock };
    };
  };
};

describe('ProductUpsertDialog', () => {
  beforeEach(() => {
    invalidateMock.mockClear();
    createProductMutateMock.mockReset();
    updateProductMutateMock.mockReset();

    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL: jest.fn(() => 'blob:product-preview'),
        revokeObjectURL: jest.fn(),
      },
    });

    trpc.product.create.useMutation.mockReturnValue({
      mutate: createProductMutateMock,
      isPending: false,
    });
    trpc.product.update.useMutation.mockReturnValue({
      mutate: updateProductMutateMock,
      isPending: false,
    });
  });

  it('hydrates and updates the product image URLs through the dropzone when editing', async () => {
    render(
      <ProductUpsertDialog
        businessOptions={[{ label: 'Casa Norte', value: 'business-1' }]}
        onOpenChange={() => undefined}
        open
        product={{
          id: 'product-1',
          businessId: 'business-1',
          configurationSummary: undefined,
          description: 'Producto inicial para editar en el catálogo.',
          images: ['https://cdn.example.com/products/original.png'],
          isFeatured: false,
          lastUpdated: '2026-04-05T10:00:00.000Z',
          name: 'Combo inicial',
          price: 1250,
          type: 'simple',
        }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText(
        /Imagenes actuales: https:\/\/cdn.example.com\/products\/original.png/i,
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByText('Subir imagen de producto'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText(
        /Imagenes actuales: https:\/\/cdn.example.com\/products\/new-product.png/i,
      ),
    ).toBeTruthy();
  });
});
