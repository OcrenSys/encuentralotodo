import type {
    AnalyticsPeriod,
    LeadVolumeBucket,
    PromotionUsageLevel,
    ReviewStrengthLevel,
} from 'types';

export interface EngagementScoreInput {
    leadCountLast30Days: number;
    totalProducts: number;
    activePromotionCount: number;
    reviewCount: number;
    averageRating: number | null;
}

export function subtractDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() - days);
    return nextDate;
}

export function roundMetric(value: number | null | undefined) {
    if (value === null || value === undefined) {
        return null;
    }

    return Number(value.toFixed(2));
}

export function resolveLeadVolumeBucket(leadCount: number): LeadVolumeBucket {
    if (leadCount <= 0) {
        return 'NONE';
    }

    if (leadCount <= 3) {
        return 'LOW';
    }

    if (leadCount <= 9) {
        return 'MEDIUM';
    }

    return 'HIGH';
}

export function resolvePromotionUsageLevel(activePromotionCount: number): PromotionUsageLevel {
    if (activePromotionCount <= 0) {
        return 'NONE';
    }

    if (activePromotionCount === 1) {
        return 'LIGHT';
    }

    return 'ACTIVE';
}

export function resolveReviewStrength(reviewCount: number, averageRating: number | null): ReviewStrengthLevel {
    if (reviewCount <= 0 || averageRating === null) {
        return 'NONE';
    }

    if (reviewCount >= 5 && averageRating >= 4.2) {
        return 'STRONG';
    }

    return 'LIMITED';
}

export function calculateEngagementScore(input: EngagementScoreInput) {
    const ratingScore = input.averageRating ? input.averageRating * 4 : 0;
    const rawScore =
        input.leadCountLast30Days * 8 +
        Math.min(input.totalProducts, 12) * 2 +
        input.activePromotionCount * 6 +
        Math.min(input.reviewCount, 10) * 3 +
        ratingScore;

    return Math.max(0, Math.min(100, Math.round(rawScore)));
}

export function isHighActivityBusiness(leadCountLast30Days: number, engagementScore: number) {
    return leadCountLast30Days >= 10 || engagementScore >= 60;
}

export function toDateKey(value: Date) {
    return value.toISOString().slice(0, 10);
}

function normalizeUtcDate(value: Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function resolveTrendRange(period: AnalyticsPeriod, now: Date, dates: Date[]) {
    if (period === '7D') {
        return { start: normalizeUtcDate(subtractDays(now, 6)), end: normalizeUtcDate(now) };
    }

    if (period === '30D') {
        return { start: normalizeUtcDate(subtractDays(now, 29)), end: normalizeUtcDate(now) };
    }

    const earliest = dates.length > 0
        ? dates.reduce((previous, current) => (previous.getTime() < current.getTime() ? previous : current))
        : now;

    return { start: normalizeUtcDate(earliest), end: normalizeUtcDate(now) };
}

export function buildTrendPoints(dates: Date[], period: AnalyticsPeriod, now: Date) {
    const { start, end } = resolveTrendRange(period, now, dates);
    const counts = new Map<string, number>();

    dates.forEach((value) => {
        const key = toDateKey(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const cursor = new Date(start);
    const points: Array<{ date: string; count: number }> = [];

    while (cursor.getTime() <= end.getTime()) {
        const key = toDateKey(cursor);
        points.push({
            date: key,
            count: counts.get(key) ?? 0,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return points;
}