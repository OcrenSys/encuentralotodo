import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ProductsScreen } from '../src/modules/products/products-screen';

const invalidateMock = jest.fn(async () => undefined);
const createProductMutateMock = jest.fn();
const exportRefetchMock = jest.fn();

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
      managed: {
        useQuery: jest.fn(),
      },
      create: {
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
      managed: {
        useQuery: jest.Mock;
      };
      create: {
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
    exportRefetchMock.mockReset();
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

    trpc.product.create.useMutation.mockReturnValue({
      mutate: createProductMutateMock,
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

    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Nuevo producto' }),
      ).toBeTruthy();
      expect(
        screen.getByRole('button', { name: /crear producto/i }),
      ).toBeTruthy();
    });
  });

  it('exports the filtered catalog as csv', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: /exportar catálogo/i }));

    await waitFor(() => {
      expect(exportRefetchMock).toHaveBeenCalled();
    });

    createElementSpy.mockRestore();
  });
});
