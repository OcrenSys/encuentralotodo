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
        label: 'Panel principal',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Resumen operativo, indicadores clave y accesos rápidos según el rol.',
        roles: ['SUPERADMIN', 'OWNER', 'MANAGER'],
        mobilePriority: 1,
    },
    {
        key: 'approvals',
        label: 'Aprobaciones',
        href: '/admin/approvals',
        icon: CheckCheck,
        description: 'Moderación y aprobaciones antes de publicar negocios.',
        roles: ['SUPERADMIN'],
        mobilePriority: 2,
    },
    {
        key: 'businesses-admin',
        label: 'Negocios',
        href: '/admin/businesses',
        icon: Building2,
        description: 'Vista global de todos los negocios registrados.',
        roles: ['SUPERADMIN'],
        mobilePriority: 3,
    },
    {
        key: 'categories',
        label: 'Categorías',
        href: '/admin/categories',
        icon: Shapes,
        description: 'Gobierno de categorías y estructura editorial.',
        roles: ['SUPERADMIN'],
    },
    {
        key: 'plans',
        label: 'Planes',
        href: '/admin/plans',
        icon: CreditCard,
        description: 'Matriz de planes, beneficios y límites comerciales.',
        roles: ['SUPERADMIN'],
    },
    {
        key: 'reports',
        label: 'Reportes',
        href: '/admin/reports',
        icon: FileBarChart2,
        description: 'Alertas de operación, salud de plataforma y reportes.',
        roles: ['SUPERADMIN'],
        mobilePriority: 4,
    },
    {
        key: 'business',
        label: 'Mi negocio',
        href: '/business',
        icon: BriefcaseBusiness,
        description: 'Marca, ubicación, horarios y estado de publicación.',
        roles: ['OWNER', 'MANAGER'],
        mobilePriority: 2,
    },
    {
        key: 'products',
        label: 'Productos',
        href: '/products',
        icon: Package,
        description: 'Catálogo, filtros y estado comercial del inventario.',
        roles: ['OWNER', 'MANAGER'],
        mobilePriority: 3,
    },
    {
        key: 'promotions',
        label: 'Promociones',
        href: '/promotions',
        icon: Megaphone,
        description: 'Campañas activas, expiradas y puntos de creación.',
        roles: ['SUPERADMIN', 'OWNER', 'MANAGER'],
        mobilePriority: 4,
    },
    {
        key: 'leads',
        label: 'Contactos',
        href: '/leads',
        icon: Inbox,
        description: 'Seguimiento comercial, fuente y estado de atención.',
        roles: ['OWNER', 'MANAGER'],
        mobilePriority: 5,
    },
    {
        key: 'team',
        label: 'Equipo',
        href: '/team',
        icon: Users,
        description: 'Coordinación entre propietario y encargados por negocio.',
        roles: ['OWNER'],
    },
    {
        key: 'analytics',
        label: 'Analítica',
        href: '/analytics',
        icon: BarChart3,
        description: 'Rendimiento comercial, tráfico y conversión.',
        roles: ['SUPERADMIN', 'OWNER'],
        mobilePriority: 5,
    },
    {
        key: 'settings',
        label: 'Configuración',
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

export const adminPrefixes = ['/admin/approvals', '/admin/businesses', '/admin/categories', '/admin/plans', '/admin/reports'];

export const managementPrefixes = ['/dashboard', '/business', '/products', '/promotions', '/leads', '/team', '/analytics', '/settings', ...adminPrefixes];