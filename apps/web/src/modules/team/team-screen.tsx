'use client';

import { Mail, ShieldCheck, Users } from 'lucide-react';
import { Button, Card, GhostButton } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { useManagementData } from '../../lib/management-data';

export function TeamScreen() {
  const { teamMembers } = useManagementData();

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Team"
        description="Placeholder funcional para coordinación owner-manager. La siguiente fase puede conectar invitaciones, permisos granulares y cambios persistentes."
        actions={
          <>
            <GhostButton type="button">Export roster</GhostButton>
            <Button type="button">Invite teammate</Button>
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
              <StatusBadge
                status={member.id.startsWith('owner') ? 'OWNER' : 'MANAGER'}
              />
              <span className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <ShieldCheck className="size-4" />
                Simulated access
              </span>
            </div>
            <div className="flex gap-2">
              <GhostButton className="flex-1" type="button">
                <Mail className="mr-2 size-4" />
                Message
              </GhostButton>
              <Button className="flex-1" type="button">
                <Users className="mr-2 size-4" />
                Permissions
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
