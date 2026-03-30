export function buildWhatsAppLink(phone: string, message?: string) {
    const normalizedPhone = phone.replace(/[^\d]/g, '');
    const text = message ? `&text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${normalizedPhone}?app_absent=0${text}`;
}

export function buildMapsLink(lat: number, lng: number, label?: string) {
    const query = label ? `${label} @${lat},${lng}` : `${lat},${lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}