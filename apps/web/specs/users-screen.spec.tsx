import { fireEvent, render, waitFor } from '@testing-library/react';

import { UsersScreen } from '../src/modules/admin/users-screen';

const invalidateMock = jest.fn(async () => undefined);
const updateRoleMutateMock = jest.fn();
const setUserActiveMutateMock = jest.fn();

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
      onValueChange,
      'aria-label': ariaLabel,
    }: {
      options: Array<{ label: string; value: string }>;
      value?: string;
      onValueChange?: (value: string) => void;
      'aria-label'?: string;
    }) => (
      <select
        aria-label={ariaLabel}
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value}
      >
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
      admin: {
        listUsers: {
          invalidate: invalidateMock,
        },
        listUsersPage: {
          invalidate: invalidateMock,
        },
      },
      auth: {
        me: {
          invalidate: invalidateMock,
        },
      },
    }),
    auth: {
      me: {
        useQuery: jest.fn(),
      },
    },
    admin: {
      listUsersPage: {
        useQuery: jest.fn(),
      },
      updateUserRole: {
        useMutation: jest.fn(),
      },
      setUserActive: {
        useMutation: jest.fn(),
      },
    },
  },
}));

const { trpc } = jest.requireMock('../src/lib/trpc') as {
  trpc: {
    auth: {
      me: {
        useQuery: jest.Mock;
      };
    };
    admin: {
      listUsersPage: {
        useQuery: jest.Mock;
      };
      updateUserRole: {
        useMutation: jest.Mock;
      };
      setUserActive: {
        useMutation: jest.Mock;
      };
    };
  };
};

describe('UsersScreen', () => {
  beforeEach(() => {
    invalidateMock.mockClear();
    updateRoleMutateMock.mockClear();
    setUserActiveMutateMock.mockClear();

    trpc.auth.me.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'superadmin-1',
        },
      },
    });
    trpc.admin.listUsersPage.useQuery.mockReturnValue({
      data: {
        items: [
          {
            id: 'user-ana',
            fullName: 'Ana Mercado',
            email: 'ana@encuentralotodo.app',
            role: 'UNASSIGNED',
            isActive: true,
            createdAt: '2026-04-01T10:00:00.000Z',
            updatedAt: '2026-04-01T10:00:00.000Z',
            identities: [
              {
                provider: 'firebase',
                externalUserId: 'firebase-user-ana',
                email: 'ana@encuentralotodo.app',
                emailVerified: true,
              },
            ],
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    });
    trpc.admin.updateUserRole.useMutation.mockReturnValue({
      mutate: updateRoleMutateMock,
      isPending: false,
      variables: undefined,
    });
    trpc.admin.setUserActive.useMutation.mockReturnValue({
      mutate: setUserActiveMutateMock,
      isPending: false,
      variables: undefined,
    });
  });

  it('submits a role change for another user', async () => {
    const view = render(<UsersScreen />);

    expect(view.getAllByDisplayValue('Sin permisos')).toHaveLength(2);

    fireEvent.change(view.getByLabelText('Rol para Ana Mercado'), {
      target: { value: 'ADMIN' },
    });
    fireEvent.click(view.getAllByRole('button', { name: 'Guardar rol' })[0]);

    await waitFor(() => {
      expect(updateRoleMutateMock).toHaveBeenCalledWith({
        userId: 'user-ana',
        role: 'ADMIN',
      });
    });
  });

  it('submits an active toggle', async () => {
    const view = render(<UsersScreen />);

    fireEvent.click(view.getAllByRole('button', { name: 'Deshabilitar' })[0]);

    await waitFor(() => {
      expect(setUserActiveMutateMock).toHaveBeenCalledWith({
        userId: 'user-ana',
        isActive: false,
      });
    });
  });
});
