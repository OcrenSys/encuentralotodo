import { fireEvent, render, waitFor } from '@testing-library/react';

import { ProfileScreen } from '../src/modules/profile/profile-screen';

const invalidateMock = jest.fn(async () => undefined);
const updateProfileMutateMock = jest.fn();
const removeOwnBusinessRoleMutateMock = jest.fn();

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../src/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({
      auth: {
        me: {
          invalidate: invalidateMock,
        },
        profile: {
          invalidate: invalidateMock,
        },
      },
    }),
    auth: {
      profile: {
        useQuery: jest.fn(),
      },
      updateProfile: {
        useMutation: jest.fn(),
      },
      removeOwnBusinessRole: {
        useMutation: jest.fn(),
      },
    },
  },
}));

const { trpc } = jest.requireMock('../src/lib/trpc') as {
  trpc: {
    auth: {
      profile: {
        useQuery: jest.Mock;
      };
      updateProfile: {
        useMutation: jest.Mock;
      };
      removeOwnBusinessRole: {
        useMutation: jest.Mock;
      };
    };
  };
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    invalidateMock.mockClear();
    updateProfileMutateMock.mockClear();
    removeOwnBusinessRoleMutateMock.mockClear();

    trpc.auth.profile.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'user-ana',
          fullName: 'Ana Mercado',
          email: 'ana@encuentralotodo.app',
          role: 'USER',
          phone: '8095550110',
          isActive: true,
          createdAt: '2026-04-01T10:00:00.000Z',
          updatedAt: '2026-04-01T10:00:00.000Z',
          lastAccessAt: '2026-04-05T09:00:00.000Z',
          identities: [
            {
              provider: 'mock',
              externalUserId: 'mock-user-ana',
              email: 'ana@encuentralotodo.app',
              emailVerified: true,
            },
          ],
        },
        authProviders: [
          {
            provider: 'mock',
            externalUserId: 'mock-user-ana',
            email: 'ana@encuentralotodo.app',
            emailVerified: true,
          },
        ],
        businessAssignments: [
          {
            id: 'assignment-1',
            userId: 'user-ana',
            businessId: 'biz-1',
            role: 'MANAGER',
            createdAt: '2026-04-04T10:00:00.000Z',
            updatedAt: '2026-04-04T10:00:00.000Z',
            businessName: 'Casa Norte Market',
            businessStatus: 'APPROVED',
          },
        ],
        auditLogs: [],
        verificationState: {
          hasVerifiedIdentity: true,
        },
      },
      isLoading: false,
      error: null,
    });
    trpc.auth.updateProfile.useMutation.mockReturnValue({
      mutate: updateProfileMutateMock,
      isPending: false,
    });
    trpc.auth.removeOwnBusinessRole.useMutation.mockReturnValue({
      mutate: removeOwnBusinessRoleMutateMock,
      isPending: false,
    });
  });

  it('submits updated self profile fields', async () => {
    const view = render(<ProfileScreen />);

    fireEvent.change(view.getByDisplayValue('Ana Mercado'), {
      target: { value: 'Ana María Mercado' },
    });
    fireEvent.change(view.getByDisplayValue('8095550110'), {
      target: { value: '8095550199' },
    });
    fireEvent.click(view.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(updateProfileMutateMock).toHaveBeenCalledWith({
        fullName: 'Ana María Mercado',
        phone: '8095550199',
      });
    });
  });

  it('renders linked business assignments', () => {
    const view = render(<ProfileScreen />);

    expect(view.getByText('Casa Norte Market')).toBeTruthy();
    expect(view.getByText('Encargado')).toBeTruthy();
  });

  it('allows managers to remove their own business assignment', () => {
    const view = render(<ProfileScreen />);

    fireEvent.click(
      view.getByRole('button', { name: 'Salir de este negocio' }),
    );

    expect(removeOwnBusinessRoleMutateMock).toHaveBeenCalledWith({
      businessId: 'biz-1',
    });
  });
});
