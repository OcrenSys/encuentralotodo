'use client';

import { Mail, ShieldCheck, Users } from 'lucide-react';
import { Button, Card, EmptyState, GhostButton, LoadingSkeleton } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { useManagementData } from '../../lib/management-data';

export function TeamScreen() {
  const { loading, teamMembers, isMockMode } = useManagementData();

  if (loading) {
    return <LoadingSkeleton className="h-[320px]" />;
  }

  if (!teamMembers.length) {
    return (
      <EmptyState
        title="No hay miembros de equipo disponibles"
        description="Esta vista se llenará con el propietario y encargados reales de tus negocios asignados."
      />
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Equipo"
        description="Vista inicial para coordinar al propietario y a los encargados del negocio con una estructura simple y clara."
        actions={
          <>
            <GhostButton type="button">Exportar lista</GhostButton>
            <Button type="button">Invitar integrante</Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teamMembers.map((member) => (
          <Card className="space-y-4 hover:translate-y-0" key={member.id}>
            <div className="flex items-start gap-4">
              {member.avatarUrl ? (
                <img
                  alt={member.fullName}
                  className="size-16 rounded-[20px] object-cover"
                  src={member.avatarUrl}
                />
              ) : (
                <div className="size-16 rounded-[20px] bg-[var(--color-primary)]/10" />
              )}
              <div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
                  {member.fullName}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {member.email}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={member.membershipRole} />
              <span className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <ShieldCheck className="size-4" />
                {isMockMode ? 'Acceso simulado' : 'Acceso real por membresía'}
              </span>
            </div>
            <div className="flex gap-2">
              <GhostButton className="flex-1" type="button">
                <Mail className="mr-2 size-4" />
                Mensaje
              </GhostButton>
              <Button className="flex-1" type="button">
                <Users className="mr-2 size-4" />
                Permisos
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
