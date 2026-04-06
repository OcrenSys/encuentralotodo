export function formatCurrencyNio(value?: number) {
    if (typeof value !== 'number') {
        return 'Precio no definido';
    }

    return new Intl.NumberFormat('es-NI', {
        currency: 'NIO',
        maximumFractionDigits: 0,
        style: 'currency',
    })
        .formatToParts(value)
        .map((part) => (part.type === 'currency' ? 'C$' : part.value))
        .join('');
}

export function sanitizeDisplayText(value?: string | null, fallback = '') {
    if (!value) {
        return fallback;
    }

    const sanitized = value
        .normalize('NFC')
        .replace(/\u0000/g, '')
        .replace(/\uFFFD/g, '');

    return sanitized || fallback;
}