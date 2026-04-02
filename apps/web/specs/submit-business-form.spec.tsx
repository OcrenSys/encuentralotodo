import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { SubmitBusinessForm } from '../src/components/submit-business-form';

jest.useFakeTimers();

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as any;
window.HTMLElement.prototype.scrollIntoView = jest.fn();

const pushMock = jest.fn();
const invalidateMock = jest.fn(async () => undefined);
const mutateMock = jest.fn();

const ownerResults = [
  {
    id: 'user-ana',
    fullName: 'Ana Mercado',
    email: 'ana@encuentralotodo.app',
    role: 'USER',
    isActive: true,
  },
  {
    id: 'user-carlos',
    fullName: 'Carlos Perez',
    email: 'carlos@encuentralotodo.app',
    role: 'ADMIN',
    isActive: true,
  },
];

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('../src/lib/platform-authorization', () => ({
  useCurrentUserRole: jest.fn(),
}));

jest.mock('../src/lib/trpc', () => ({
  trpc: {
    useUtils: jest.fn(),
    business: {
      create: {
        useMutation: jest.fn(),
      },
    },
    admin: {
      searchUsers: {
        useQuery: jest.fn(),
      },
    },
  },
}));

const { useCurrentUserRole } = jest.requireMock(
  '../src/lib/platform-authorization',
) as { useCurrentUserRole: jest.Mock };

const { trpc } = jest.requireMock('../src/lib/trpc') as any;

describe('SubmitBusinessForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    invalidateMock.mockClear();
    mutateMock.mockReset();

    useCurrentUserRole.mockReturnValue({
      currentUser: {
        id: 'admin-luis',
        role: 'ADMIN',
      },
      isLoading: false,
    });

    trpc.useUtils.mockReturnValue({
      business: {
        list: {
          invalidate: invalidateMock,
        },
      },
    });

    trpc.business.create.useMutation.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });

    trpc.admin.searchUsers.useQuery.mockImplementation(
      ({ search }: { search: string }) => ({
        data:
          search.toLowerCase().includes('ana') || search === ''
            ? ownerResults
            : [],
        isLoading: false,
        error: null,
      }),
    );
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('debounces user search and submits ownerId plus managers correctly', async () => {
    render(<SubmitBusinessForm />);

    fireEvent.click(
      screen.getByRole('button', { name: /responsable principal/i }),
    );

    const searchInput = screen.getByPlaceholderText(
      /buscar por nombre, email o identificador/i,
    );
    fireEvent.change(searchInput, { target: { value: 'Ana' } });

    expect(trpc.admin.searchUsers.useQuery).toHaveBeenLastCalledWith(
      { search: '', limit: 10 },
      expect.objectContaining({ enabled: true }),
    );

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(trpc.admin.searchUsers.useQuery).toHaveBeenCalledWith(
        { search: 'Ana', limit: 10 },
        expect.objectContaining({ enabled: true }),
      );
    });

    fireEvent.click(screen.getByText('Ana Mercado'));

    fireEvent.click(screen.getByRole('button', { name: /encargados/i }));

    fireEvent.click(screen.getByText('Carlos Perez'));

    fireEvent.change(screen.getByPlaceholderText('Ej. Casa Norte Market'), {
      target: { value: 'Casa Norte Market' },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/describe el tipo de negocio/i),
      {
        target: {
          value:
            'Supermercado de proximidad con delivery y catálogo básico para discovery.',
        },
      },
    );
    fireEvent.change(screen.getByPlaceholderText('Ej. Piantini'), {
      target: { value: 'Piantini' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Av. Abraham Lincoln 1012, Santo Domingo'),
      {
        target: { value: 'Av. Abraham Lincoln 1012, Santo Domingo' },
      },
    );

    fireEvent.click(
      screen.getByRole('button', { name: /enviar para aprobación/i }),
    );

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-ana',
          managers: ['user-carlos'],
          name: 'Casa Norte Market',
        }),
      );
    });
  });

  it('shows an empty owner state when no remote results match', async () => {
    trpc.admin.searchUsers.useQuery.mockImplementation(
      ({ search }: { search: string }) => ({
        data: search === 'zzz' ? [] : ownerResults,
        isLoading: false,
        error: null,
      }),
    );

    render(<SubmitBusinessForm />);

    fireEvent.click(
      screen.getByRole('button', { name: /responsable principal/i }),
    );
    fireEvent.change(
      screen.getByPlaceholderText(/buscar por nombre, email o identificador/i),
      {
        target: { value: 'zzz' },
      },
    );

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText(/no encontramos usuarios para/i)).toBeTruthy();
    });
  });
});
