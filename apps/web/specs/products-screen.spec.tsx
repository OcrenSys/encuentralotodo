import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ProductsScreen } from '../src/modules/products/products-screen';
import { getProductCatalogPrimaryActionLabel } from '../src/modules/products/product-catalog-csv-dialog';

const invalidateMock = jest.fn(async () => undefined);
const createProductMutateMock = jest.fn();
const updateProductMutateMock = jest.fn();
const deleteProductMutateMock = jest.fn();
const exportRefetchMock = jest.fn();
const previewImportMutateAsyncMock = jest.fn();
const importManagedMutateAsyncMock = jest.fn();

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('ui', () => {
  const actual = jest.requireActual('ui');

  return {
    ...actual,
    Select: ({
      options,
      value,
      placeholder,
      onValueChange,
      'aria-label': ariaLabel,
    }: {
      options: Array<{ label: string; value: string }>;
      value?: string;
      placeholder?: string;
      onValueChange?: (value: string) => void;
      'aria-label'?: string;
    }) => (
      <select
        aria-label={ariaLabel ?? placeholder}
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
    ),
  };
});

jest.mock('../src/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({
      business: {
        managed: {
          invalidate: invalidateMock,
        },
        managedPage: {
          invalidate: invalidateMock,
        },
      },
      product: {
        managed: {
          invalidate: invalidateMock,
        },
      },
    }),
    business: {
      managed: {
        useQuery: jest.fn(),
      },
    },
    product: {
      exportManagedCsv: {
        useQuery: jest.fn(),
      },
      importManaged: {
        useMutation: jest.fn(),
      },
      managed: {
        useQuery: jest.fn(),
      },
      previewManagedImport: {
        useMutation: jest.fn(),
      },
      create: {
        useMutation: jest.fn(),
      },
      delete: {
        useMutation: jest.fn(),
      },
      update: {
        useMutation: jest.fn(),
      },
    },
  },
}));

const { trpc } = jest.requireMock('../src/lib/trpc') as {
  trpc: {
    business: {
      managed: {
        useQuery: jest.Mock;
      };
    };
    product: {
      exportManagedCsv: {
        useQuery: jest.Mock;
      };
      importManaged: {
        useMutation: jest.Mock;
      };
      managed: {
        useQuery: jest.Mock;
      };
      previewManagedImport: {
        useMutation: jest.Mock;
      };
      create: {
        useMutation: jest.Mock;
      };
      delete: {
        useMutation: jest.Mock;
      };
      update: {
        useMutation: jest.Mock;
      };
    };
  };
};

describe('ProductsScreen', () => {
  const createObjectUrlMock = jest.fn(() => 'blob:catalogo');
  const revokeObjectUrlMock = jest.fn();

  beforeEach(() => {
    invalidateMock.mockClear();
    createProductMutateMock.mockClear();
    updateProductMutateMock.mockClear();
    deleteProductMutateMock.mockClear();
    exportRefetchMock.mockReset();
    previewImportMutateAsyncMock.mockReset();
    importManagedMutateAsyncMock.mockReset();
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();

    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL: createObjectUrlMock,
        revokeObjectURL: revokeObjectUrlMock,
      },
    });

    trpc.business.managed.useQuery.mockReturnValue({
      data: [
        {
          id: 'business-1',
          name: 'Casa Norte',
        },
      ],
      isLoading: false,
      error: null,
    });

    trpc.product.managed.useQuery.mockReturnValue({
      data: {
        items: [
          {
            id: 'product-1',
            name: 'Combo ejecutivo',
            description: 'Almuerzo completo con bebida y postre para oficina.',
            images: ['https://example.com/product-1.jpg'],
            type: 'simple',
            price: 1250,
            isFeatured: true,
            businessId: 'business-1',
            businessName: 'Casa Norte',
            businessStatus: 'APPROVED',
            lastUpdated: '2026-04-01T10:00:00.000Z',
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });

    trpc.product.exportManagedCsv.useQuery.mockReturnValue({
      isFetching: false,
      refetch: exportRefetchMock,
    });

    trpc.product.previewManagedImport.useMutation.mockReturnValue({
      isPending: false,
      mutateAsync: previewImportMutateAsyncMock,
    });

    trpc.product.importManaged.useMutation.mockReturnValue({
      isPending: false,
      mutateAsync: importManagedMutateAsyncMock,
    });

    trpc.product.create.useMutation.mockReturnValue({
      mutate: createProductMutateMock,
      isPending: false,
    });

    trpc.product.delete.useMutation.mockReturnValue({
      mutate: deleteProductMutateMock,
      isPending: false,
    });

    trpc.product.update.useMutation.mockReturnValue({
      mutate: updateProductMutateMock,
      isPending: false,
    });
  });

  it('loads the managed products query and opens the create dialog', async () => {
    render(<ProductsScreen />);

    expect(trpc.product.managed.useQuery).toHaveBeenCalledWith(
      {
        businessId: undefined,
        featured: 'ALL',
        page: 1,
        pageSize: 10,
        search: '',
      },
      expect.objectContaining({ retry: false }),
    );

    expect(screen.getByText('Combo ejecutivo')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Nuevo' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nuevo' })).toBeTruthy();
      expect(
        screen.getByRole('button', { name: /crear producto/i }),
      ).toBeTruthy();
    });
  });

  it('exports the filtered catalog as csv from the csv dialog', async () => {
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation(((
        tagName: string,
        options?: ElementCreationOptions,
      ) => {
        if (tagName.toLowerCase() === 'a') {
          return {
            click: jest.fn(),
            download: '',
            href: '',
            remove: jest.fn(),
          } as unknown as HTMLAnchorElement;
        }

        return originalCreateElement(tagName, options);
      }) as typeof document.createElement);

    exportRefetchMock.mockResolvedValue({
      data: {
        content: 'id,name\nproduct-1,Combo ejecutivo',
        fileName: 'catalogo-productos-2026-04-02.csv',
        mimeType: 'text/csv;charset=utf-8;',
      },
    });

    render(<ProductsScreen />);

    fireEvent.click(screen.getByRole('button', { name: /catálogo csv/i }));
    fireEvent.click(screen.getByRole('button', { name: /descargar csv/i }));

    await waitFor(() => {
      expect(exportRefetchMock).toHaveBeenCalled();
    });

    createElementSpy.mockRestore();
  });

  it('shows Preview Import as the initial csv action', async () => {
    render(<ProductsScreen />);

    fireEvent.click(screen.getByRole('button', { name: /catálogo csv/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Catálogo CSV' }),
      ).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'Preview Import' }),
      ).toBeTruthy();
    });
  });

  it('requires a selected business before enabling csv import', async () => {
    trpc.product.managed.useQuery.mockReturnValueOnce({
      data: {
        items: [
          {
            id: 'product-1',
            name: 'Combo ejecutivo',
            description: 'Almuerzo completo con bebida y postre para oficina.',
            images: ['https://example.com/product-1.jpg'],
            type: 'simple',
            price: 1250,
            isFeatured: true,
            businessId: 'business-1',
            businessName: 'Casa Norte',
            businessStatus: 'APPROVED',
            lastUpdated: '2026-04-01T10:00:00.000Z',
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });

    render(<ProductsScreen />);

    fireEvent.click(screen.getByRole('button', { name: /catálogo csv/i }));

    await waitFor(() => {
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement | null;

      expect(
        screen.getByText(
          /para importar, primero filtra la pantalla por un negocio específico/i,
        ),
      ).toBeTruthy();
      expect(fileInput?.disabled).toBe(true);
      expect(
        (
          screen.getByRole('button', {
            name: 'Preview Import',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });
  });

  it('uses the same primary action label helper for preview and import states', () => {
    expect(
      getProductCatalogPrimaryActionLabel({
        importPending: false,
        isImportReady: false,
        previewPending: false,
      }),
    ).toBe('Preview Import');

    expect(
      getProductCatalogPrimaryActionLabel({
        importPending: false,
        isImportReady: true,
        previewPending: false,
      }),
    ).toBe('Import Products');
  });

  it('opens the shared dialog in edit mode from a product card', async () => {
    render(<ProductsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Editar' })).toBeTruthy();
      expect(screen.getByRole('button', { name: /guardar/i })).toBeTruthy();
    });
  });

  it('deletes a product from the card actions', async () => {
    render(<ProductsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(deleteProductMutateMock).toHaveBeenCalledWith({
        productId: 'product-1',
      });
    });
  });
});
