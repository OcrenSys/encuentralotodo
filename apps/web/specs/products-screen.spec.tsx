import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ProductsScreen } from '../src/modules/products/products-screen';

const invalidateMock = jest.fn(async () => undefined);
const createProductMutateMock = jest.fn();

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
  beforeEach(() => {
    invalidateMock.mockClear();
    createProductMutateMock.mockClear();

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

    trpc.product.create.useMutation.mockReturnValue({
      mutate: createProductMutateMock,
      isPending: false,
    });
  });

  it('loads the managed products query and submits the create dialog', async () => {
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

    fireEvent.change(screen.getByPlaceholderText('Combo ejecutivo'), {
      target: { value: 'Bowl tropical' },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        /describe beneficios, contenido o características clave/i,
      ),
      {
        target: {
          value:
            'Bowl fresco con frutas, yogur griego y toppings pensado para desayuno y merienda.',
        },
      },
    );
    fireEvent.change(screen.getAllByPlaceholderText('https://...')[0], {
      target: { value: 'https://example.com/bowl.jpg' },
    });
    fireEvent.change(screen.getByPlaceholderText('1250'), {
      target: { value: '890' },
    });

    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      expect(createProductMutateMock).toHaveBeenCalledWith({
        businessId: 'business-1',
        description:
          'Bowl fresco con frutas, yogur griego y toppings pensado para desayuno y merienda.',
        images: ['https://example.com/bowl.jpg'],
        isFeatured: false,
        name: 'Bowl tropical',
        price: 890,
      });
    });
  });
});
