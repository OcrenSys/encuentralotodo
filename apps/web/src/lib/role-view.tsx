'use client';

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const managementRoles = ['SUPERADMIN', 'OWNER', 'MANAGER'] as const;
export type ManagementRole = (typeof managementRoles)[number];

type RoleProfile = {
  role: ManagementRole;
  label: string;
  fullName: string;
  email: string;
  userId: string;
};

type RoleViewContextValue = {
  roleView: ManagementRole;
  roleProfile: RoleProfile;
  setRoleView: (role: ManagementRole) => void;
  isReady: boolean;
};

const storageKey = 'encuentralotodo.web.role-view';

export const roleProfiles: Record<ManagementRole, RoleProfile> = {
  SUPERADMIN: {
    role: 'SUPERADMIN',
    label: 'SuperAdmin',
    fullName: 'Luis Admin',
    email: 'luis@encuentralotodo.app',
    userId: 'admin-luis',
  },
  OWNER: {
    role: 'OWNER',
    label: 'Owner',
    fullName: 'Sofia Rivas',
    email: 'sofia@encuentralotodo.app',
    userId: 'owner-sofia',
  },
  MANAGER: {
    role: 'MANAGER',
    label: 'Manager',
    fullName: 'Carlos Mena',
    email: 'carlos@encuentralotodo.app',
    userId: 'manager-carlos',
  },
};

const RoleViewContext = createContext<RoleViewContextValue | null>(null);

export function RoleViewProvider({ children }: { children: React.ReactNode }) {
  const [roleView, setRoleViewState] = useState<ManagementRole>('SUPERADMIN');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedRole = window.localStorage.getItem(storageKey);
    if (storedRole && managementRoles.includes(storedRole as ManagementRole)) {
      setRoleViewState(storedRole as ManagementRole);
    }
    setIsReady(true);
  }, []);

  const setRoleView = (nextRole: ManagementRole) => {
    startTransition(() => {
      setRoleViewState(nextRole);
    });
    window.localStorage.setItem(storageKey, nextRole);
  };

  const value = useMemo(
    () => ({
      roleView,
      roleProfile: roleProfiles[roleView],
      setRoleView,
      isReady,
    }),
    [isReady, roleView],
  );

  return (
    <RoleViewContext.Provider value={value}>
      {children}
    </RoleViewContext.Provider>
  );
}

export function useRoleView() {
  const context = useContext(RoleViewContext);

  if (!context) {
    throw new Error('useRoleView must be used within RoleViewProvider.');
  }

  return context;
}
