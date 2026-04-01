import { fireEvent, render, waitFor } from '@testing-library/react';

import { LoginScreen } from '../src/modules/auth/login-screen';

const replaceMock = jest.fn();
const signInWithPasswordMock = jest.fn();
const registerWithPasswordMock = jest.fn();
const signInWithGoogleMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'next' ? '/analytics' : null),
  }),
}));

jest.mock('../src/lib/auth-context', () => ({
  useCurrentAuthUser: jest.fn(),
}));

const { useCurrentAuthUser } = jest.requireMock('../src/lib/auth-context') as {
  useCurrentAuthUser: jest.Mock;
};

describe('LoginScreen', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    signInWithPasswordMock.mockReset();
    registerWithPasswordMock.mockReset();
    signInWithGoogleMock.mockReset();

    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      provider: 'firebase',
      user: null,
      signInWithPassword: signInWithPasswordMock,
      registerWithPassword: registerWithPasswordMock,
      signInWithGoogle: signInWithGoogleMock,
    });
  });

  it('submits email login and redirects to the requested route', async () => {
    const view = render(<LoginScreen />);

    fireEvent.change(view.getByPlaceholderText('operaciones@empresa.com'), {
      target: { value: 'ops@example.com' },
    });
    fireEvent.change(view.getByPlaceholderText('••••••••'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(view.getByRole('button', { name: 'Entrar con email' }));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: 'ops@example.com',
        password: 'secret123',
      });
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/analytics');
    });
  });

  it('redirects immediately when the user is already authenticated', async () => {
    useCurrentAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      provider: 'firebase',
      user: {
        uid: 'firebase-user',
        email: 'ops@example.com',
        displayName: 'Ops',
        photoURL: null,
        provider: 'password',
      },
      signInWithPassword: signInWithPasswordMock,
      registerWithPassword: registerWithPasswordMock,
      signInWithGoogle: signInWithGoogleMock,
    });

    render(<LoginScreen />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/analytics');
    });
  });
});
