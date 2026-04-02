import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    BriefcaseBusiness,
    Building2,
    CheckCheck,
    CreditCard,
    FileBarChart2,
    FolderKanban,
    Inbox,
    LayoutDashboard,
    Megaphone,
    Package,
    Settings,
    Shapes,
    Users,
} from 'lucide-react';
import type { UserRole } from 'types';

import type { ManagementRole } from './role-view';
import { assignedPlatformRoles, platformAdminRoles, superAdminRoles } from './platform-roles';

export type NavigationAccessContext =
    | { mode: 'mock'; role: ManagementRole }
    | {
          mode: 'real';
          role: UserRole | null | undefined;
          hasManagedBusinesses: boolean;
          ownsManagedBusinesses: boolean;
      };

export type NavigationItem = {
    key: string;
    label: string;
    href: string;
    icon: LucideIcon;
    description: string;
    demoRoles: ManagementRole[];
    platformRoles?: readonly UserRole[];
    realBusinessAccess?: 'managed' | 'owned';
    mobilePriority?: number;
};

export const navigationItems: NavigationItem[] = [
    {
        key: 'dashboard',
        label: 'Panel principal',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Resumen operativo, indicadores clave y accesos rápidos según el rol.',
        demoRoles: ['SUPERADMIN', 'OWNER', 'MANAGER'],
        platformRoles: platformAdminRoles,
        realBusinessAccess: 'managed',
        mobilePriority: 1,
    },
    {
        key: 'approvals',
        label: 'Aprobaciones',
        href: '/admin/approvals',
        icon: CheckCheck,
        description: 'Moderación y aprobaciones antes de publicar negocios.',
        demoRoles: ['SUPERADMIN'],
        platformRoles: platformAdminRoles,
        mobilePriority: 2,
    },
    {
        key: 'businesses-admin',
        label: 'Negocios',
        href: '/admin/businesses',
        icon: Building2,
        description: 'Vista global de todos los negocios registrados.',
        demoRoles: ['SUPERADMIN'],
        platformRoles: platformAdminRoles,
        mobilePriority: 3,
    },
    {
        key: 'platform-users',
        label: 'Usuarios',
        href: '/admin/users',
        icon: Users,
        description: 'Gestión de roles y acceso para usuarios de la plataforma.',
        demoRoles: ['SUPERADMIN'],
        platformRoles: superAdminRoles,
    },
    {
        key: 'categories',
        label: 'Categorías',
        href: '/admin/categories',
        icon: Shapes,
        description: 'Gobierno de categorías y estructura editorial.',
        demoRoles: ['SUPERADMIN'],
        platformRoles: superAdminRoles,
    },
    {
        key: 'plans',
        label: 'Planes',
        href: '/admin/plans',
        icon: CreditCard,
        description: 'Matriz de planes, beneficios y límites comerciales.',
        demoRoles: ['SUPERADMIN'],
        platformRoles: platformAdminRoles,
    },
    {
        key: 'reports',
        label: 'Reportes',
        href: '/admin/reports',
        icon: FileBarChart2,
        description: 'Alertas de operación, salud de plataforma y reportes.',
        demoRoles: ['SUPERADMIN'],
        platformRoles: platformAdminRoles,
        mobilePriority: 4,
    },
    {
        key: 'business',
        label: 'Mi negocio',
        href: '/business',
        icon: BriefcaseBusiness,
        description: 'Marca, ubicación, horarios y estado de publicación.',
        demoRoles: ['OWNER', 'MANAGER'],
        realBusinessAccess: 'managed',
        mobilePriority: 2,
    },
    {
        key: 'products',
        label: 'Productos',
        href: '/products',
        icon: Package,
        description: 'Catálogo, filtros y estado comercial del inventario.',
        demoRoles: ['OWNER', 'MANAGER'],
        realBusinessAccess: 'managed',
        mobilePriority: 3,
    },
    {
        key: 'promotions',
        label: 'Promociones',
        href: '/promotions',
        icon: Megaphone,
        description: 'Campañas activas, expiradas y puntos de creación.',
        demoRoles: ['SUPERADMIN', 'OWNER', 'MANAGER'],
        realBusinessAccess: 'managed',
        mobilePriority: 4,
    },
    {
        key: 'leads',
        label: 'Contactos',
        href: '/leads',
        icon: Inbox,
        description: 'Seguimiento comercial, fuente y estado de atención.',
        demoRoles: ['OWNER', 'MANAGER'],
        realBusinessAccess: 'managed',
        mobilePriority: 5,
    },
    {
        key: 'team',
        label: 'Equipo',
        href: '/team',
        icon: Users,
        description: 'Coordinación entre propietario y encargados por negocio.',
        demoRoles: ['OWNER'],
        realBusinessAccess: 'owned',
    },
    {
        key: 'analytics',
        label: 'Analítica',
        href: '/analytics',
        icon: BarChart3,
        description: 'Rendimiento comercial, tráfico y conversión.',
        demoRoles: ['SUPERADMIN', 'OWNER'],
        platformRoles: platformAdminRoles,
        realBusinessAccess: 'managed',
        mobilePriority: 5,
    },
    {
        key: 'settings',
        label: 'Configuración',
        href: '/settings',
        icon: Settings,
        description: 'Preferencias, notificaciones y operación.',
        demoRoles: ['SUPERADMIN', 'OWNER', 'MANAGER'],
        platformRoles: assignedPlatformRoles,
        mobilePriority: 6,
    },
];

function isItemVisibleForContext(item: NavigationItem, context: NavigationAccessContext) {
    if (context.mode === 'mock') {
        return item.demoRoles.includes(context.role);
    }

    if (context.role && item.platformRoles?.includes(context.role)) {
        return true;
    }

    if (item.realBusinessAccess === 'owned') {
        return context.ownsManagedBusinesses;
    }

    if (item.realBusinessAccess === 'managed') {
        return context.hasManagedBusinesses;
    }

    return false;
}

export function getNavigationForAccess(context: NavigationAccessContext) {
    return navigationItems.filter((item) => isItemVisibleForContext(item, context));
}

export function getMobileNavigationForAccess(context: NavigationAccessContext) {
    return getNavigationForAccess(context)
        .filter((item) => item.mobilePriority !== undefined)
        .sort((left, right) => (left.mobilePriority ?? 99) - (right.mobilePriority ?? 99))
        .slice(0, 5);
}

export function getNavigationItemByPath(pathname: string) {
    return navigationItems.find((item) => pathname === item.href);
}

export function isPathAllowedForAccess(pathname: string, context: NavigationAccessContext) {
    return navigationItems.some((item) => item.href === pathname && isItemVisibleForContext(item, context));
}

export function getDefaultPathForAccess(context: NavigationAccessContext) {
    return getNavigationForAccess(context)[0]?.href ?? '/settings';
}

export const routeSearchLabels: Partial<Record<string, string>> = {
    '/dashboard': 'Buscar ideas o acciones rápidas',
    '/business': 'Buscar secciones del negocio',
    '/products': 'Buscar productos o SKU',
    '/promotions': 'Buscar promociones activas o expiradas',
    '/leads': 'Buscar contactos, estados o canales',
    '/team': 'Buscar miembros del equipo',
    '/analytics': 'Buscar métricas o periodos',
    '/settings': 'Buscar ajustes',
    '/admin/approvals': 'Buscar aprobaciones pendientes',
    '/admin/businesses': 'Buscar negocios registrados',
    '/admin/users': 'Buscar usuarios, roles o estado de acceso',
    '/admin/categories': 'Buscar categorías',
    '/admin/plans': 'Buscar planes',
    '/admin/reports': 'Buscar reportes',
};

export const routeEyebrows: Partial<Record<string, string>> = {
    '/dashboard': 'Resumen general',
    '/business': 'Operación del negocio',
    '/products': 'Gestión de catálogo',
    '/promotions': 'Gestión de campañas',
    '/leads': 'Atención comercial',
    '/team': 'Gestión de equipo',
    '/analytics': 'Rendimiento',
    '/settings': 'Configuración',
    '/admin/approvals': 'Operación de plataforma',
    '/admin/businesses': 'Operación de plataforma',
    '/admin/users': 'Operación de plataforma',
    '/admin/categories': 'Operación de plataforma',
    '/admin/plans': 'Ingresos y planes',
    '/admin/reports': 'Salud de plataforma',
};

export const quickLinks = [
    { label: 'Panel principal', href: '/dashboard' },
    { label: 'Vista pública', href: '/discovery' },
    { label: 'Registrar negocio', href: '/submit-business' },
    { label: 'Cola de aprobaciones', href: '/admin/approvals' },
] as const;

export const adminPrefixes = ['/admin/approvals', '/admin/businesses', '/admin/users', '/admin/categories', '/admin/plans', '/admin/reports'];

export const managementPrefixes = ['/dashboard', '/business', '/products', '/promotions', '/leads', '/team', '/analytics', '/settings', ...adminPrefixes];