import { render, waitFor } from '@testing-library/react';

import { AppShell } from '../src/components/layout/app-shell';

const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock('../src/lib/auth-context', () => ({
  useCurrentAuthUser: jest.fn(),
}));

jest.mock('../src/lib/role-view', () => ({
  useRoleView: jest.fn(),
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

describe('AppShell', () => {
  beforeEach(() => {
    replaceMock.mockReset();

    useRoleView.mockReturnValue({
      roleView: 'SUPERADMIN',
      isReady: true,
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
});
