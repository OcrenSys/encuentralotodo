'use client';

import { useMemo } from 'react';

import { marketplaceSeed, type BusinessSummary } from 'types';

import { useCurrentAuthUser } from './auth-context';
import { hasPlatformRole, platformAdminRoles } from './platform-roles';
import { trpc } from './trpc';
import { roleProfiles, useRoleView } from './role-view';

type LeadRecord = {
    id: string;
    name: string;
    businessName: string;
    source: 'WhatsApp' | 'Promo' | 'Perfil' | 'Formulario';
    status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED';
    updatedAt: string;
    summary: string;
};

type TaskRecord = {
    id: string;
    title: string;
    state: 'Today' | 'Queued' | 'Blocked';
    owner: string;
};

type ActivityRecord = {
    id: string;
    title: string;
    detail: string;
    time: string;
};

function formatActivityDate(value: string) {
    return new Date(value).toLocaleDateString('es-DO', {
        month: 'short',
        day: 'numeric',
    });
}

const leadFixtures = {
    SUPERADMIN: [
        {
            id: 'lead-1',
            name: 'Valentina Guzman',
            businessName: 'Casa Norte Market',
            source: 'Promo',
            status: 'NEW',
            updatedAt: 'Hace 12 min',
            summary: 'Consultó por promo 2x1 y envío express en Zona Norte.',
        },
        {
            id: 'lead-2',
            name: 'Julio Peña',
            businessName: 'Sabor Urbano',
            source: 'WhatsApp',
            status: 'QUALIFIED',
            updatedAt: 'Hace 38 min',
            summary: 'Pidió cotización de catering para oficina de 25 personas.',
        },
    ],
    OWNER: [
        {
            id: 'lead-3',
            name: 'Mariela Soto',
            businessName: 'Casa Norte Market',
            source: 'Perfil',
            status: 'CONTACTED',
            updatedAt: 'Hace 8 min',
            summary: 'Solicitó lista de productos para compra recurrente semanal.',
        },
        {
            id: 'lead-4',
            name: 'Eduardo Molina',
            businessName: 'Sabor Urbano',
            source: 'Formulario',
            status: 'NEW',
            updatedAt: 'Hace 22 min',
            summary: 'Dejó mensaje para menú corporativo con entrega recurrente.',
        },
        {
            id: 'lead-5',
            name: 'Paola Cruz',
            businessName: 'Casa Norte Market',
            source: 'WhatsApp',
            status: 'CLOSED',
            updatedAt: 'Hace 1 h',
            summary: 'Convirtió pedido de reposición para oficina pequeña.',
        },
    ],
    MANAGER: [
        {
            id: 'lead-6',
            name: 'Rafael Paredes',
            businessName: 'Casa Norte Market',
            source: 'Promo',
            status: 'NEW',
            updatedAt: 'Hace 5 min',
            summary: 'Preguntó disponibilidad y tiempo de entrega del combo promocional.',
        },
        {
            id: 'lead-7',
            name: 'Andrea Tejada',
            businessName: 'Casa Norte Market',
            source: 'WhatsApp',
            status: 'CONTACTED',
            updatedAt: 'Hace 44 min',
            summary: 'Necesita seguimiento para un pedido mayorista.',
        },
    ],
} satisfies Record<keyof typeof roleProfiles, LeadRecord[]>;

const taskFixtures = {
    SUPERADMIN: [
        { id: 'task-sa-1', title: 'Revisar negocios pendientes en cola', state: 'Today', owner: 'Ops' },
        { id: 'task-sa-2', title: 'Validar consistencia de planes premium', state: 'Queued', owner: 'Billing' },
        { id: 'task-sa-3', title: 'Cerrar reporte de salud de catálogo', state: 'Blocked', owner: 'Data' },
    ],
    OWNER: [
        { id: 'task-own-1', title: 'Actualizar branding de Casa Norte Market', state: 'Today', owner: 'Sofia' },
        { id: 'task-own-2', title: 'Ajustar promociones antes del cierre', state: 'Queued', owner: 'Marketing' },
        { id: 'task-own-3', title: 'Responder leads corporativos', state: 'Today', owner: 'Ventas' },
    ],
    MANAGER: [
        { id: 'task-mgr-1', title: 'Revisar productos destacados de la semana', state: 'Today', owner: 'Carlos' },
        { id: 'task-mgr-2', title: 'Responder nuevos mensajes de promo', state: 'Queued', owner: 'Carlos' },
        { id: 'task-mgr-3', title: 'Confirmar horario extendido del negocio', state: 'Blocked', owner: 'Owner' },
    ],
} satisfies Record<keyof typeof roleProfiles, TaskRecord[]>;

function sortByRecent(left: { lastUpdated: string }, right: { lastUpdated: string }) {
    return new Date(right.lastUpdated).getTime() - new Date(left.lastUpdated).getTime();
}

function uniqueBusinessesById(businesses: BusinessSummary[]) {
    const cache = new Map<string, BusinessSummary>();
    businesses.forEach((business) => {
        cache.set(business.id, business);
    });
    return Array.from(cache.values());
}

export function useManagementData() {
    const { provider } = useCurrentAuthUser();
    const { roleView, roleProfile } = useRoleView();
    const isMockMode = provider === 'mock';
    const sessionQuery = trpc.auth.me.useQuery(undefined, {
        enabled: true,
        retry: false,
    });
    const backendUser = sessionQuery.data?.user ?? null;
    const platformRole = backendUser?.role;
    const isPlatformAdmin = hasPlatformRole(platformRole, platformAdminRoles);
    const canViewPlatformData = isMockMode ? roleView === 'SUPERADMIN' : isPlatformAdmin;
    const platformAnalyticsQuery = trpc.analytics.platformOverview.useQuery(
        { period: '30D' },
        {
            enabled: canViewPlatformData,
            retry: false,
        },
    );
    const businessQuery = trpc.business.list.useQuery(
        { includePending: true },
        {
            enabled: isMockMode || isPlatformAdmin,
            retry: false,
        },
    );
    const promotionsQuery = trpc.promotion.listActive.useQuery(undefined, {
        enabled: isMockMode || isPlatformAdmin,
        retry: false,
    });
    const pendingBusinessesQuery = trpc.admin.pendingBusinesses.useQuery(undefined, {
        enabled: canViewPlatformData,
        retry: false,
    });

    const allBusinesses = useMemo(
        () => ((businessQuery.data ?? []) as BusinessSummary[]).sort(sortByRecent),
        [businessQuery.data],
    );

    const accessibleBusinesses = useMemo(() => {
        if (!isMockMode) {
            return isPlatformAdmin ? allBusinesses : [];
        }

        if (roleView === 'SUPERADMIN') {
            return allBusinesses;
        }

        if (roleView === 'OWNER') {
            return allBusinesses.filter((business) => business.ownerId === roleProfile.userId);
        }

        return allBusinesses.filter((business) => business.managers.includes(roleProfile.userId));
    }, [allBusinesses, isMockMode, isPlatformAdmin, roleProfile.userId, roleView]);

    const primaryBusiness = isMockMode ? accessibleBusinesses[0] ?? null : null;

    const businessAnalyticsQuery = trpc.analytics.businessOverview.useQuery(
        {
            businessId: primaryBusiness?.id ?? '',
            period: '30D',
        },
        {
            enabled: isMockMode && roleView !== 'SUPERADMIN' && Boolean(primaryBusiness),
            retry: false,
        },
    );

    const managedProducts = useMemo(
        () => {
            if (!isMockMode) {
                return [];
            }

            return marketplaceSeed.products
                .filter((product) => accessibleBusinesses.some((business) => business.id === product.businessId))
                .map((product) => {
                    const business = allBusinesses.find((item) => item.id === product.businessId);

                    return {
                        ...product,
                        businessName: business?.name ?? 'Negocio',
                        businessStatus: business?.status ?? 'PENDING',
                    };
                })
                .sort(sortByRecent);
        },
        [accessibleBusinesses, allBusinesses, isMockMode],
    );

    const managedPromotions = useMemo(() => {
        if (!isMockMode && !isPlatformAdmin) {
            return [];
        }

        const promotionsSource = promotionsQuery.data ?? [];
        const visibleIds = new Set(accessibleBusinesses.map((business) => business.id));

        return promotionsSource
            .filter((promotion) => !isMockMode || roleView === 'SUPERADMIN' || visibleIds.has(promotion.businessId))
            .map((promotion) => ({
                ...promotion,
                businessName:
                    allBusinesses.find((business) => business.id === promotion.businessId)?.name ??
                    'Negocio',
            }));
    }, [accessibleBusinesses, allBusinesses, isMockMode, isPlatformAdmin, promotionsQuery.data, roleView]);

    const teamMembers = useMemo(() => {
        if (!isMockMode) {
            return [];
        }

        const personIds = new Set<string>();

        accessibleBusinesses.forEach((business) => {
            personIds.add(business.ownerId);
            business.managers.forEach((managerId) => personIds.add(managerId));
        });

        return marketplaceSeed.users.filter((user) => personIds.has(user.id));
    }, [accessibleBusinesses, isMockMode]);

    const recentActivity = useMemo<ActivityRecord[]>(() => {
        if (canViewPlatformData && platformAnalyticsQuery.data) {
            const leaderboardActivity = platformAnalyticsQuery.data.businessActivityLeaderboard.map((business) => ({
                id: `leader-${business.businessId}`,
                title: business.businessName,
                detail: `${business.leadCount} leads, ${business.activePromotionCount} promos activas y score ${business.engagementScore}.`,
                time: '30d',
            }));

            const candidateActivity = platformAnalyticsQuery.data.monetizationCandidates.map((business) => ({
                id: `candidate-${business.businessId}`,
                title: `${business.businessName} listo para upsell`,
                detail: business.reasons[0] ?? 'Actividad suficiente para evaluación comercial.',
                time: business.leadVolumeBucket,
            }));

            return [...leaderboardActivity, ...candidateActivity].slice(0, 6);
        }

        if (isMockMode && businessAnalyticsQuery.data) {
            const leadActivity = businessAnalyticsQuery.data.recentLeads.map((lead) => ({
                id: `lead-${lead.id}`,
                title: lead.name,
                detail: `${lead.businessName} · ${lead.source} · ${lead.summary}`,
                time: formatActivityDate(lead.createdAt),
                sortKey: lead.createdAt,
            }));

            const promotionActivity = businessAnalyticsQuery.data.recentPromotions.map((promotion) => ({
                id: `promotion-${promotion.id}`,
                title: promotion.title,
                detail: `${promotion.businessName} · vence ${formatActivityDate(promotion.validUntil)}`,
                time: formatActivityDate(promotion.createdAt),
                sortKey: promotion.createdAt,
            }));

            return [...leadActivity, ...promotionActivity]
                .sort((left, right) => new Date(right.sortKey).getTime() - new Date(left.sortKey).getTime())
                .slice(0, 6)
                .map(({ sortKey: _sortKey, ...item }) => item);
        }

        const businessActivity = accessibleBusinesses.map((business) => ({
            id: `business-${business.id}`,
            title: business.name,
            detail: `${business.status === 'APPROVED' ? 'Perfil publicado' : 'Pendiente de aprobación'} en ${business.location.zone}`,
            time: new Date(business.lastUpdated).toLocaleDateString('es-DO', {
                month: 'short',
                day: 'numeric',
            }),
        }));

        const promotionActivity = managedPromotions.slice(0, 3).map((promotion) => ({
            id: `promotion-${promotion.id}`,
            title: promotion.title,
            detail: `${promotion.businessName} mantiene la campaña activa.`,
            time: new Date(promotion.validUntil).toLocaleDateString('es-DO', {
                month: 'short',
                day: 'numeric',
            }),
        }));

        const adminActivity = (pendingBusinessesQuery.data ?? []).slice(0, 2).map((business) => ({
            id: `pending-${business.id}`,
            title: `${business.name} requiere revisión`,
            detail: `Aún espera aprobación para salir a discovery móvil.`,
            time: 'Pendiente',
        }));

        return [...businessActivity, ...promotionActivity, ...(canViewPlatformData ? adminActivity : [])].slice(0, 6);
    }, [
        accessibleBusinesses,
        businessAnalyticsQuery.data,
        canViewPlatformData,
        isMockMode,
        managedPromotions,
        pendingBusinessesQuery.data,
        platformAnalyticsQuery.data,
    ]);

    const platformHealth = useMemo(() => {
        if (platformAnalyticsQuery.data) {
            const pendingCount = platformAnalyticsQuery.data.summary.pendingBusinesses;
            if (pendingCount === 0) {
                return 'Stable';
            }
            if (pendingCount < 3) {
                return 'Needs review';
            }
            return 'Busy queue';
        }

        const pendingCount = pendingBusinessesQuery.data?.length ?? 0;
        if (pendingCount === 0) {
            return 'Stable';
        }
        if (pendingCount < 3) {
            return 'Needs review';
        }
        return 'Busy queue';
    }, [pendingBusinessesQuery.data, platformAnalyticsQuery.data]);

    const analyticsLoading =
        (canViewPlatformData && platformAnalyticsQuery.isLoading) ||
        (isMockMode && roleView !== 'SUPERADMIN' && Boolean(primaryBusiness) && businessAnalyticsQuery.isLoading);

    const loading =
        businessQuery.isLoading ||
        promotionsQuery.isLoading ||
        sessionQuery.isLoading ||
        analyticsLoading ||
        (canViewPlatformData && pendingBusinessesQuery.isLoading);

    return {
        isMockMode,
        backendUser,
        platformRole,
        isPlatformAdmin,
        canViewPlatformData,
        roleView,
        roleProfile,
        sessionQuery,
        businessAnalytics: businessAnalyticsQuery.data,
        businessAnalyticsQuery,
        businessQuery,
        promotionsQuery,
        platformAnalytics: platformAnalyticsQuery.data,
        platformAnalyticsQuery,
        pendingBusinessesQuery,
        loading,
        allBusinesses,
        accessibleBusinesses: uniqueBusinessesById(accessibleBusinesses),
        primaryBusiness,
        managedProducts,
        managedPromotions,
        teamMembers,
        leads: isMockMode ? leadFixtures[roleView] : [],
        tasks: isMockMode ? taskFixtures[roleView] : [],
        recentActivity,
        platformHealth,
    };
}