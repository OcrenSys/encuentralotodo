import type { PromotionStatus } from 'types';

export function resolvePromotionStatus(input: {
    endDate: Date;
    now?: Date;
    storedStatus: string;
}): PromotionStatus {
    if (input.storedStatus === 'DRAFT') {
        return 'DRAFT';
    }

    if (input.endDate.getTime() < (input.now ?? new Date()).getTime()) {
        return 'EXPIRED';
    }

    return 'ACTIVE';
}

export function normalizePromotionStatusForPersistence(input: {
    endDate: Date;
    requestedStatus: string;
    now?: Date;
}) {
    if (input.requestedStatus === 'DRAFT') {
        return 'DRAFT';
    }

    if (input.endDate.getTime() < (input.now ?? new Date()).getTime()) {
        return 'EXPIRED';
    }

    return 'ACTIVE';
}
