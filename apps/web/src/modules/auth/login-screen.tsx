'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, FormField, Input, LoadingSkeleton } from 'ui';

import { useCurrentAuthUser } from '../../lib/auth-context';
import { BrandLogo } from '../../components/branding/brand-logo';
import { hasFirebasePublicConfig } from '../../lib/firebase-auth';

const authModeSchema = z.enum(['login', 'register']);
type AuthMode = z.infer<typeof authModeSchema>;

const baseFormSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  displayName: z.string().trim().max(80).optional(),
});

type LoginFormValues = z.infer<typeof baseFormSchema>;

function mapFirebaseError(error: unknown) {
  if (!(error instanceof Error)) {
    return 'No fue posible completar la autenticación.';
  }

  if (error.message.includes('auth/invalid-credential')) {
    return 'Credenciales inválidas. Verifica el correo y la contraseña.';
  }

  if (error.message.includes('auth/email-already-in-use')) {
    return 'Ese correo ya está registrado.';
  }

  if (error.message.includes('auth/popup-closed-by-user')) {
    return 'El inicio de sesión con Google fue cancelado.';
  }

  if (error.message.includes('auth/operation-not-allowed')) {
    return 'Ese método de autenticación no está habilitado en Firebase.';
  }

  return error.message || 'No fue posible completar la autenticación.';
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isLoading,
    provider,
    signInWithGoogle,
    signInWithPassword,
    registerWithPassword,
    user,
  } = useCurrentAuthUser();
  const hasFirebaseConfig = hasFirebasePublicConfig();
  const isFirebaseRuntime = provider === 'firebase' && hasFirebaseConfig;
  const [mode, setMode] = useState<AuthMode>('login');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const nextPath = useMemo(
    () => searchParams.get('next') || '/dashboard',
    [searchParams],
  );

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(baseFormSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      if (mode === 'register') {
        await registerWithPassword({
          email: values.email,
          password: values.password,
          displayName: values.displayName?.trim() || undefined,
        });
      } else {
        await signInWithPassword({
          email: values.email,
          password: values.password,
        });
      }

      router.replace(nextPath);
    } catch (error) {
      setSubmitError(mapFirebaseError(error));
    }
  });

  const handleGoogleSignIn = async () => {
    setSubmitError(null);
    setIsGooglePending(true);

    try {
      await signInWithGoogle();
      router.replace(nextPath);
    } catch (error) {
      setSubmitError(mapFirebaseError(error));
    } finally {
      setIsGooglePending(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <LoadingSkeleton className="h-[520px] rounded-xl" />
          <LoadingSkeleton className="h-[520px] rounded-xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(196,230,255,0.42),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,229,182,0.28),transparent_34%),linear-gradient(180deg,#f4f8fc_0%,#eef3f8_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-soft flex flex-col justify-between rounded-xl p-8 sm:p-10">
          <div className="space-y-4">
            <BrandLogo className="pb-2" markClassName="w-14 sm:w-16" />
            <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              Acceso autenticado
            </span>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-text-secondary sm:text-5xl">
                Entra con tu identidad real y continúa la operación.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-text-muted sm:text-base">
                Firebase resuelve la sesión del cliente y deja el token listo
                para que el backend valide identidad, cree el usuario local y
                desacople permisos del proveedor de auth.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Sesión persistente',
                value: 'Local',
                helper: 'La sesión se restaura al volver a abrir la consola.',
              },
              {
                label: 'Proveedor activo',
                value: provider.toUpperCase(),
                helper:
                  'Listo para cambiarse por otra implementación más adelante.',
              },
              {
                label: 'Destino',
                value: nextPath,
                helper: 'La consola vuelve a la ruta pedida después del login.',
              },
            ].map((item) => (
              <div className="surface-inset rounded-xl p-4" key={item.label}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                  {item.label}
                </p>
                <p className="mt-3 font-display text-2xl font-semibold text-text-secondary">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {item.helper}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Card
          className="space-y-6 p-8 sm:p-10"
          interactive={false}
          variant="elevated"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              {mode === 'login' ? 'Login' : 'Registro básico'}
            </p>
            <h2 className="font-display text-3xl font-semibold text-text-secondary">
              {mode === 'login' ? 'Inicia sesión' : 'Crea una cuenta'}
            </h2>
            <p className="text-sm leading-6 text-text-muted">
              {mode === 'login'
                ? 'Usa tu cuenta real para entrar a la consola y habilitar llamadas autenticadas al backend.'
                : 'Registro liviano para validar el flujo completo sobre Firebase Authentication.'}
            </p>
          </div>

          {!isFirebaseRuntime ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {provider === 'firebase'
                ? 'Firebase está seleccionado como proveedor público, pero faltan variables NEXT_PUBLIC_FIREBASE_* en el runtime del navegador. Reinicia la web después de cargar el .env correcto.'
                : 'Esta build no tiene Firebase Authentication habilitado. El login y el registro reales quedan bloqueados hasta que el runtime público use `NEXT_PUBLIC_AUTH_PROVIDER=firebase`.'}
            </div>
          ) : null}

          <div className="inline-flex rounded-full border border-border-subtle bg-white/60 p-1">
            {authModeSchema.options.map((candidateMode) => {
              const active = mode === candidateMode;

              return (
                <button
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-normal ${
                    active
                      ? 'action-primary text-white shadow-sm'
                      : 'text-text-muted'
                  }`}
                  key={candidateMode}
                  onClick={() => {
                    setMode(candidateMode);
                    setSubmitError(null);
                  }}
                  type="button"
                >
                  {candidateMode === 'login' ? 'Login' : 'Registro'}
                </button>
              );
            })}
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => void handleSubmit(event)}
          >
            {mode === 'register' ? (
              <FormField
                error={form.formState.errors.displayName?.message}
                label="Nombre visible"
                hint="Opcional. Se usa para el perfil inicial en Firebase."
              >
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    className="pl-11"
                    placeholder="Nombre del operador"
                    {...form.register('displayName')}
                  />
                </div>
              </FormField>
            ) : null}

            <FormField
              error={form.formState.errors.email?.message}
              label="Correo"
            >
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <Input
                  className="pl-11"
                  placeholder="operaciones@empresa.com"
                  type="email"
                  {...form.register('email')}
                />
              </div>
            </FormField>

            <FormField
              error={form.formState.errors.password?.message}
              hint={
                mode === 'register'
                  ? 'Firebase requiere mínimo 6 caracteres.'
                  : undefined
              }
              label="Contraseña"
            >
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <Input
                  className="pl-11"
                  placeholder="••••••••"
                  type="password"
                  {...form.register('password')}
                />
              </div>
            </FormField>

            {submitError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <Button
              className="w-full justify-center gap-2"
              disabled={form.formState.isSubmitting || !isFirebaseRuntime}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {mode === 'login' ? 'Entrar con email' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              o
            </span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <Button
            className="w-full justify-center gap-2"
            disabled={isGooglePending || !isFirebaseRuntime}
            onClick={() => void handleGoogleSignIn()}
            type="button"
            variant="google"
          >
            {isGooglePending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Continuar con Google
          </Button>

          <div className="rounded-xl border border-border-subtle bg-white/65 px-4 py-3 text-sm leading-6 text-text-muted">
            {user ? (
              <>
                Sesión activa como{' '}
                <strong className="text-text-secondary">
                  {user.email ?? user.displayName}
                </strong>
                .
              </>
            ) : (
              <>
                Una vez autenticado, la consola podrá adjuntar tu ID token de
                Firebase a las llamadas tRPC de forma centralizada.
              </>
            )}
          </div>

          <p className="text-sm leading-6 text-text-muted">
            También puedes explorar la vitrina pública en{' '}
            <Link
              className="font-semibold text-secondary hover:underline"
              href="/discovery"
            >
              /discovery
            </Link>
            .
          </p>
        </Card>
      </div>
    </main>
  );
}
