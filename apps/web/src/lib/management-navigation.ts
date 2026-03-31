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

import type { ManagementRole } from './role-view';

export type NavigationItem = {
    key: string;
    label: string;
    href: string;
    icon: LucideIcon;
    description: string;
    roles: ManagementRole[];
    mobilePriority?: number;
};

export const navigationItems: NavigationItem[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Resumen operativo, KPIs y quick actions por rol.',
        roles: ['SUPERADMIN', 'OWNER', 'MANAGER'],
        mobilePriority: 1,
    },
    {
        key: 'approvals',
        label: 'Approvals',
        href: '/admin/approvals',
        icon: CheckCheck,
        description: 'Moderación y aprobaciones antes de publicar negocios.',
        roles: ['SUPERADMIN'],
        mobilePriority: 2,
    },
    {
        key: 'businesses-admin',
        label: 'Businesses',
        href: '/admin/businesses',
        icon: Building2,
        description: 'Vista global de todos los negocios registrados.',
        roles: ['SUPERADMIN'],
        mobilePriority: 3,
    },
    {
        key: 'categories',
        label: 'Categories',
        href: '/admin/categories',
        icon: Shapes,
        description: 'Gobierno de categorías y estructura editorial.',
        roles: ['SUPERADMIN'],
    },
    {
        key: 'plans',
        label: 'Plans',
        href: '/admin/plans',
        icon: CreditCard,
        description: 'Matriz de planes, beneficios y límites comerciales.',
        roles: ['SUPERADMIN'],
    },
    {
        key: 'reports',
        label: 'Reports',
        href: '/admin/reports',
        icon: FileBarChart2,
        description: 'Alertas de operación, salud de plataforma y reportes.',
        roles: ['SUPERADMIN'],
        mobilePriority: 4,
    },
    {
        key: 'business',
        label: 'My Business',
        href: '/business',
        icon: BriefcaseBusiness,
        description: 'Branding, ubicación, horarios y estado de publicación.',
        roles: ['OWNER', 'MANAGER'],
        mobilePriority: 2,
    },
    {
        key: 'products',
        label: 'Products',
        href: '/products',
        icon: Package,
        description: 'Catálogo, filtros y estado comercial del inventario.',
        roles: ['OWNER', 'MANAGER'],
        mobilePriority: 3,
    },
    {
        key: 'promotions',
        label: 'Promotions',
        href: '/promotions',
        icon: Megaphone,
        description: 'Campañas activas, expiradas y puntos de creación.',
        roles: ['SUPERADMIN', 'OWNER', 'MANAGER'],
        mobilePriority: 4,
    },
    {
        key: 'leads',
        label: 'Leads',
        href: '/leads',
        icon: Inbox,
        description: 'Seguimiento comercial, fuente y estado de atención.',
        roles: ['OWNER', 'MANAGER'],
        mobilePriority: 5,
    },
    {
        key: 'team',
        label: 'Team',
        href: '/team',
        icon: Users,
        description: 'Coordinación de owner y managers por negocio.',
        roles: ['OWNER'],
    },
    {
        key: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        description: 'Performance comercial, tráfico y conversión.',
        roles: ['SUPERADMIN', 'OWNER'],
        mobilePriority: 5,
    },
    {
        key: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Preferencias, notificaciones y operación.',
        roles: ['SUPERADMIN', 'OWNER', 'MANAGER'],
        mobilePriority: 6,
    },
];

export function getNavigationForRole(role: ManagementRole) {
    return navigationItems.filter((item) => item.roles.includes(role));
}

export function getMobileNavigationForRole(role: ManagementRole) {
    return getNavigationForRole(role)
        .filter((item) => item.mobilePriority !== undefined)
        .sort((left, right) => (left.mobilePriority ?? 99) - (right.mobilePriority ?? 99))
        .slice(0, 5);
}

export function getNavigationItemByPath(pathname: string) {
    return navigationItems.find((item) => pathname === item.href);
}

export function isPathAllowedForRole(pathname: string, role: ManagementRole) {
    return navigationItems.some((item) => item.href === pathname && item.roles.includes(role));
}

export function getDefaultPathForRole(role: ManagementRole) {
    return getNavigationForRole(role)[0]?.href ?? '/dashboard';
}

export const routeSearchLabels: Partial<Record<string, string>> = {
    '/dashboard': 'Buscar insights o acciones rápidas',
    '/business': 'Buscar secciones del negocio',
    '/products': 'Buscar productos o SKU',
    '/promotions': 'Buscar promociones activas o expiradas',
    '/leads': 'Buscar leads, estados o canales',
    '/team': 'Buscar miembros del equipo',
    '/analytics': 'Buscar métricas o periodos',
    '/settings': 'Buscar ajustes',
    '/admin/approvals': 'Buscar aprobaciones pendientes',
    '/admin/businesses': 'Buscar negocios registrados',
    '/admin/categories': 'Buscar categorías',
    '/admin/plans': 'Buscar planes',
    '/admin/reports': 'Buscar reportes',
};

export const routeEyebrows: Partial<Record<string, string>> = {
    '/dashboard': 'Overview',
    '/business': 'Business Workspace',
    '/products': 'Catalog Ops',
    '/promotions': 'Campaign Ops',
    '/leads': 'Lead Desk',
    '/team': 'Team Ops',
    '/analytics': 'Performance',
    '/settings': 'Configuration',
    '/admin/approvals': 'Platform Ops',
    '/admin/businesses': 'Platform Ops',
    '/admin/categories': 'Platform Ops',
    '/admin/plans': 'Revenue Ops',
    '/admin/reports': 'Platform Health',
};

export const quickLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Legacy discovery', href: '/discovery' },
    { label: 'Submit business', href: '/submit-business' },
    { label: 'Approval queue', href: '/admin/approvals' },
] as const;

export const adminPrefixes = ['/admin/approvals', '/admin/businesses', '/admin/categories', '/admin/plans', '/admin/reports'];

export const managementPrefixes = ['/dashboard', '/business', '/products', '/promotions', '/leads', '/team', '/analytics', '/settings', ...adminPrefixes];