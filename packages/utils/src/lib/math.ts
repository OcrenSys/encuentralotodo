import type { Review } from 'types';

export function calculateAverageRating(reviews: Review[]) {
    if (reviews.length === 0) {
        return 0;
    }

    const total = reviews.reduce((accumulator, review) => accumulator + review.rating, 0);
    return total / reviews.length;
}

export function calculateDistanceKm(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latitudeDelta = toRadians(destination.lat - origin.lat);
    const longitudeDelta = toRadians(destination.lng - origin.lng);
    const latitudeA = toRadians(origin.lat);
    const latitudeB = toRadians(destination.lat);

    const haversine =
        Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
        Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}