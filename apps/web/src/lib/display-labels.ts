const statusLabels: Record<string, string> = {
  APPROVED: 'Aprobado',
  ACTIVE: 'Activo',
  CLOSED: 'Cerrado',
  PENDING: 'Pendiente',
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  QUEUED: 'En cola',
  BLOCKED: 'Bloqueado',
  EXPIRED: 'Vencido',
  TODAY: 'Hoy',
  OWNER: 'Propietario',
  MANAGER: 'Encargado',
  UNASSIGNED: 'Sin permisos',
  SUPERADMIN: 'Administrador general',
  USER: 'Usuario',
  FEATURED: 'Destacado',
  CATALOG: 'Catálogo',
};

const subscriptionLabels: Record<string, string> = {
  FREE_TRIAL: 'Prueba gratis',
  PREMIUM: 'Premium',
  PREMIUM_PLUS: 'Premium Plus',
};

const categoryLabels: Record<string, string> = {
  GENERAL_STORE: 'Tienda general',
  RESTAURANT: 'Restaurante',
  SERVICE: 'Servicios',
};

function humanizeLabel(value: string) {
  const normalized = value.replaceAll('_', ' ').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatStatusLabel(status: string) {
  const normalized = status.toUpperCase();
  return statusLabels[normalized] ?? humanizeLabel(normalized);
}

export function formatSubscriptionLabel(subscriptionType: string) {
  const normalized = subscriptionType.toUpperCase();
  return subscriptionLabels[normalized] ?? humanizeLabel(normalized);
}

export function formatBusinessCategoryLabel(category: string) {
  const normalized = category.toUpperCase();
  return categoryLabels[normalized] ?? humanizeLabel(normalized);
}

export function formatRoleLabel(role: string) {
  return formatStatusLabel(role);
}