import { render, waitFor } from '@testing-library/react';

import { AppShell } from '../src/components/layout/app-shell';

const replaceMock = jest.fn();
const usePathnameMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => usePathnameMock(),
}));

jest.mock('../src/lib/auth-context', () => ({
  useCurrentAuthUser: jest.fn(),
}));

jest.mock('../src/lib/role-view', () => ({
  useRoleView: jest.fn(),
}));

jest.mock('../src/lib/trpc', () => ({
  trpc: {
    auth: {
      me: {
        useQuery: jest.fn(),
      },
    },
    business: {
      managed: {
        useQuery: jest.fn(),
      },
    },
  },
}));

jest.mock('../src/components/layout/sidebar', () => ({
  Sidebar: () => <div>Sidebar</div>,
}));

jest.mock('../src/components/layout/topbar', () => ({
  Topbar: () => <div>Topbar</div>,
}));

jest.mock('../src/components/layout/bottom-nav', () => ({
  BottomNav: () => <div>BottomNav</div>,
}));

jest.mock('../src/components/layout/active-simulation-floating', () => ({
  ActiveSimulationFloating: () => <div>Simulation</div>,
}));

const { useCurrentAuthUser } = jest.requireMock('../src/lib/auth-context') as {
  useCurrentAuthUser: jest.Mock;
};

const { useRoleView } = jest.requireMock('../src/lib/role-view') as {
  useRoleView: jest.Mock;
};

const { trpc } = jest.requireMock('../src/lib/trpc') as {
  trpc: {
    auth: {
      me: {
        useQuery: jest.Mock;
      };
    };
    business: {
      managed: {
        useQuery: jest.Mock;
      };
    };
  };
};

describe('AppShell', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    usePathnameMock.mockReturnValue('/dashboard');

    useRoleView.mockReturnValue({
      roleView: 'SUPERADMIN',
      isReady: true,
    });

    trpc.auth.me.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'superadmin-1',
          role: 'SUPERADMIN',
          isActive: true,
        },
      },
      isLoading: false,
    });
    trpc.business.managed.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it('redirects unauthenticated firebase sessions to login', async () => {
    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      provider: 'firebase',
    });

    render(
      <AppShell activePath="/dashboard">
        <div>Private content</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login?next=%2Fdashboard');
    });
  });

  it('derives the active path from the current pathname when rendered from a shared layout', () => {
    usePathnameMock.mockReturnValue('/admin/users');
    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      provider: 'firebase',
    });
    trpc.auth.me.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'admin-luis',
          role: 'ADMIN',
          isActive: true,
        },
      },
      isLoading: false,
    });

    const view = render(
      <AppShell>
        <div>Private content</div>
      </AppShell>,
    );

    expect(
      view.getByText('Esta vista requiere permisos de SuperAdmin'),
    ).toBeTruthy();
  });

  it('renders management content in mock mode without redirect', () => {
    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      provider: 'mock',
    });

    const view = render(
      <AppShell activePath="/dashboard">
        <div>Private content</div>
      </AppShell>,
    );

    expect(view.getByText('Private content')).toBeTruthy();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('blocks disabled backend accounts even with an authenticated Firebase session', () => {
    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      provider: 'firebase',
    });
    trpc.auth.me.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'user-ana',
          role: 'USER',
          isActive: false,
        },
      },
      isLoading: false,
    });

    const view = render(
      <AppShell activePath="/dashboard">
        <div>Private content</div>
      </AppShell>,
    );

    expect(view.getByText('Tu cuenta está deshabilitada')).toBeTruthy();
  });

  it('blocks authenticated users whose role is still unassigned', () => {
    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      provider: 'firebase',
    });
    trpc.auth.me.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'user-ana',
          role: 'UNASSIGNED',
          isActive: true,
        },
      },
      isLoading: false,
    });

    const view = render(
      <AppShell activePath="/dashboard">
        <div>Private content</div>
      </AppShell>,
    );

    expect(
      view.getByText('Tu cuenta aún no tiene permisos asignados'),
    ).toBeTruthy();
  });

  it('blocks the platform users screen for non-superadmin backend roles', () => {
    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      provider: 'firebase',
    });
    trpc.auth.me.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'admin-luis',
          role: 'ADMIN',
          isActive: true,
        },
      },
      isLoading: false,
    });

    const view = render(
      <AppShell activePath="/admin/users">
        <div>Private content</div>
      </AppShell>,
    );

    expect(
      view.getByText('Esta vista requiere permisos de SuperAdmin'),
    ).toBeTruthy();
  });

  it('uses the backend superadmin role for platform user management even if the saved role view differs', () => {
    useRoleView.mockReturnValue({
      roleView: 'OWNER',
      isReady: true,
    });
    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      provider: 'firebase',
    });
    trpc.auth.me.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'superadmin-1',
          role: 'SUPERADMIN',
          isActive: true,
        },
      },
      isLoading: false,
    });

    const view = render(
      <AppShell activePath="/admin/users">
        <div>Private content</div>
      </AppShell>,
    );

    expect(view.getByText('Private content')).toBeTruthy();
  });

  it('allows real business routes when the authenticated user manages businesses', () => {
    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      provider: 'firebase',
    });
    trpc.auth.me.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'manager-carlos',
          role: 'USER',
          isActive: true,
        },
      },
      isLoading: false,
    });
    trpc.business.managed.useQuery.mockReturnValue({
      data: [
        {
          id: 'biz-casa-norte',
          owner: { id: 'owner-sofia' },
        },
      ],
      isLoading: false,
    });

    const view = render(
      <AppShell activePath="/business">
        <div>Private content</div>
      </AppShell>,
    );

    expect(view.getByText('Private content')).toBeTruthy();
  });
});
