import { render } from '@testing-library/react';

import { AuthUserPanel } from '../src/components/auth/auth-user-panel';

const replaceMock = jest.fn();
const signOutMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock('../src/lib/auth-context', () => ({
  useCurrentAuthUser: jest.fn(),
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

const { trpc } = jest.requireMock('../src/lib/trpc') as {
  trpc: {
    auth: {
      me: {
        useQuery: jest.Mock;
      };
    };
  };
};

describe('AuthUserPanel', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    signOutMock.mockReset();

    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: true,
      provider: 'firebase',
      user: {
        uid: 'firebase-superadmin',
        email: 'ocrensys@gmail.com',
        displayName: 'Jairo Martinez',
        photoURL: null,
        provider: 'password',
      },
      signOut: signOutMock,
    });
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

  it('renders the authenticated backend user role instead of demo metadata', () => {
    const view = render(<AuthUserPanel />);

    expect(view.getByText('Jairo Martinez')).toBeTruthy();
    expect(
      view.getByText('ocrensys@gmail.com · Administrador general'),
    ).toBeTruthy();
  });
});
