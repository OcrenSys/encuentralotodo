export function formatCurrency(value: number, currency = 'USD') {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency,
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
}

export function formatDateLabel(value: string) {
    return new Intl.DateTimeFormat('es-DO', {
        day: '2-digit',
        month: 'short',
    }).format(new Date(value));
}

export function formatRelativeDistance(distanceKm: number) {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }

    return `${distanceKm.toFixed(1)} km`;
}

export function formatRating(value: number) {
    return value.toFixed(1);
}