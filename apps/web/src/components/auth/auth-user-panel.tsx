'use client';

import { LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from 'ui';

import { useCurrentAuthUser } from '../../lib/auth-context';
import { formatRoleLabel } from '../../lib/display-labels';
import { trpc } from '../../lib/trpc';

function getUserInitials(displayName: string | null, email: string | null) {
  const source = displayName?.trim() || email?.trim() || 'ET';
  const parts = source.split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatProviderLabel(provider: string) {
  if (provider === 'google.com') {
    return 'Google';
  }

  if (provider === 'password') {
    return 'Email y contraseña';
  }

  return 'Firebase';
}

export function AuthUserPanel() {
  const router = useRouter();
  const { isAuthenticated, provider, signOut, user } = useCurrentAuthUser();
  const sessionQuery = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="surface-soft flex items-center gap-3 rounded-lg px-4 py-3">
        <div className="icon-tile size-11 rounded-full bg-primary/10 text-text-secondary">
          <ShieldCheck className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
            Sesión
          </p>
          <p className="text-sm font-semibold text-text-secondary">Invitado</p>
          <a
            className="text-xs font-medium text-secondary hover:underline"
            href="/login"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      router.replace('/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  const sessionUser = sessionQuery.data?.user;
  const displayName =
    sessionUser?.fullName ??
    user.displayName ??
    user.email ??
    'Usuario autenticado';
  const displayEmail = sessionUser?.email ?? user.email ?? 'Sin email';
  const displayMeta = sessionUser
    ? `${displayEmail} · ${formatRoleLabel(sessionUser.role)}`
    : `${displayEmail} · ${
        provider === 'firebase'
          ? formatProviderLabel(user.provider)
          : 'Modo demo'
      }`;

  return (
    <div className="surface-soft flex items-center gap-3 rounded-lg px-4 py-3">
      {user.photoURL ? (
        <img
          alt={displayName}
          className="size-11 rounded-full border border-border-subtle object-cover"
          src={user.photoURL}
        />
      ) : (
        <div className="icon-tile size-11 rounded-full text-sm font-semibold">
          {getUserInitials(user.displayName, user.email)}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
          Cuenta autenticada
        </p>
        <p className="truncate text-sm font-semibold text-text-secondary">
          {displayName}
        </p>
        <p className="truncate text-xs text-text-muted">{displayMeta}</p>
      </div>

      <Button
        aria-label="Cerrar sesión"
        className="gap-2 px-3 py-2 text-xs"
        disabled={isSigningOut}
        onClick={() => void handleSignOut()}
        type="button"
        variant="ghost"
      >
        <LogOut className="size-4" />
        {isSigningOut ? 'Saliendo...' : 'Salir'}
      </Button>
    </div>
  );
}
