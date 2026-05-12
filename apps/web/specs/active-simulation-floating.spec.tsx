import { fireEvent, render } from '@testing-library/react';

import { ActiveSimulationFloating } from '../src/components/layout/active-simulation-floating';

jest.mock('../src/lib/auth-context', () => ({
  useCurrentAuthUser: jest.fn(),
}));

jest.mock('../src/lib/role-view', () => ({
  useRoleView: jest.fn(),
  roleProfiles: {
    SUPERADMIN: {
      role: 'SUPERADMIN',
      label: 'Administrador general',
      fullName: 'Luis Admin',
      email: 'luis@encuentralotodo.app',
      userId: 'admin-luis',
    },
  },
}));

jest.mock('../src/lib/trpc', () => ({
  trpc: {
    auth: {
      me: {
        useQuery: jest.fn(),
      },
    },
  },
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
  };
};

describe('ActiveSimulationFloating', () => {
  beforeEach(() => {
    useRoleView.mockReturnValue({ roleView: 'SUPERADMIN' });
    useCurrentAuthUser.mockReturnValue({ provider: 'firebase' });
    trpc.auth.me.useQuery.mockReturnValue({
      data: {
        user: {
          id: 'superadmin-1',
          fullName: 'Jairo Martinez',
          email: 'ocrensys@gmail.com',
          role: 'SUPERADMIN',
        },
      },
    });
  });

  it('shows the logged-in backend user instead of demo profile data when real auth is active', () => {
    const view = render(<ActiveSimulationFloating />);

    fireEvent.mouseEnter(view.getByRole('button', { name: 'Usuario actual' }));

    expect(view.getByText('Sesión actual')).toBeTruthy();
    expect(view.getByText('Jairo Martinez')).toBeTruthy();
    expect(view.getByText('ocrensys@gmail.com')).toBeTruthy();
  });
});
