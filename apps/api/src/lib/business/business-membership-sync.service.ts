import type { BusinessAssignmentRole } from 'types';

import {
    collectCanonicalMembershipSync,
    type BusinessMembershipSourceRecord,
} from './business-membership';

interface BusinessMembershipSyncRepository {
    listBusinessMembershipSources(businessIds?: string[]): Promise<BusinessMembershipSourceRecord[]>;
    upsertCanonicalMemberships(input: Array<{ businessId: string; userId: string; role: BusinessAssignmentRole }>): Promise<void>;
}

export interface BusinessMembershipSyncPort {
    synchronizeAllBusinessMemberships(): Promise<void>;
}

export class BusinessMembershipSyncService implements BusinessMembershipSyncPort {
    constructor(private readonly repository: BusinessMembershipSyncRepository) { }

    async synchronizeAllBusinessMemberships() {
        const records = await this.repository.listBusinessMembershipSources();
        const { missingRoles, conflicts } = collectCanonicalMembershipSync(records);

        if (conflicts.length > 0) {
            throw new Error(`Business membership conflicts require manual review: ${conflicts.join(' | ')}`);
        }

        if (missingRoles.length === 0) {
            return;
        }

        await this.repository.upsertCanonicalMemberships(missingRoles);
    }
}