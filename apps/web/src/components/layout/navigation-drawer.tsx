'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'ui';

import type { NavigationGroup } from '../../lib/management-navigation';
import { BrandLogo } from '../branding/brand-logo';
import { ManagementNavigationList } from './management-navigation-list';

export function NavigationDrawer({
  activePath,
  groups,
  onOpenChange,
  open,
}: {
  activePath: string;
  groups: NavigationGroup[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="left-0 top-0 h-[100dvh] max-h-[100dvh] w-[min(24rem,calc(100vw-1.5rem))] max-w-none translate-x-0 translate-y-0 rounded-l-none rounded-r-[1.75rem] border-l-0 p-0 lg:hidden">
        <div className="flex h-full min-h-0 flex-col bg-[var(--shell-gradient)]">
          <DialogHeader className="border-b border-border-subtle px-5 py-5 pr-14">
            <BrandLogo className="pb-2" />
            <DialogTitle className="mt-2">Navegación de gestión</DialogTitle>
            <DialogDescription>
              Accede a cualquier sección de la consola sin depender solo de la
              barra inferior.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <ManagementNavigationList
              activePath={activePath}
              groups={groups}
              onNavigate={() => onOpenChange(false)}
              showQuickLinks
              variant="comfortable"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
