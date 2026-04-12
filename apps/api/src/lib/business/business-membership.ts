import type { BusinessAssignmentRole, UserRole } from 'types';

export interface BusinessMembershipUserSourceRecord {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    isActive?: boolean;
}

export interface BusinessMembershipManagerSourceRecord {
    userId: string;
    user?: BusinessMembershipUserSourceRecord | null;
}

export interface BusinessMembershipRoleSourceRecord {
    userId: string;
    role: BusinessAssignmentRole;
    user?: BusinessMembershipUserSourceRecord | null;
}

export interface BusinessMembershipSourceRecord {
    id: string;
    ownerId: string;
    owner?: BusinessMembershipUserSourceRecord | null;
    managers?: BusinessMembershipManagerSourceRecord[];
    userRoles?: BusinessMembershipRoleSourceRecord[];
}

export interface CanonicalBusinessMembershipInput {
    businessId: string;
    userId: string;
    role: BusinessAssignmentRole;
}

export interface ResolvedBusinessMembershipState {
    ownerId: string;
    owner?: BusinessMembershipUserSourceRecord;
    managers: Array<{
        userId: string;
        user?: BusinessMembershipUserSourceRecord;
    }>;
    memberships: Array<{
        userId: string;
        role: BusinessAssignmentRole;
        user?: BusinessMembershipUserSourceRecord;
    }>;
    missingCanonicalRoles: CanonicalBusinessMembershipInput[];
    conflicts: string[];
}

function createMembershipRecord(
    userId: string,
    role: BusinessAssignmentRole,
    user?: BusinessMembershipUserSourceRecord,
) {
    return {
        userId,
        role,
        user,
    };
}

export function resolveBusinessMembershipState(record: BusinessMembershipSourceRecord): ResolvedBusinessMembershipState {
    const legacyOwner = record.owner ?? undefined;
    const legacyManagersById = new Map<string, BusinessMembershipUserSourceRecord | undefined>(
        (record.managers ?? []).map((manager) => [manager.userId, manager.user ?? undefined]),
    );
    const membershipByUserId = new Map<string, ReturnType<typeof createMembershipRecord>>();
    const missingCanonicalRoles: CanonicalBusinessMembershipInput[] = [];
    const conflicts: string[] = [];

    for (const membership of record.userRoles ?? []) {
        const existing = membershipByUserId.get(membership.userId);
        const user = membership.user
            ?? legacyManagersById.get(membership.userId)
            ?? (membership.userId === record.ownerId ? legacyOwner : undefined);

        if (existing && existing.role !== membership.role) {
            conflicts.push(`Business ${record.id} has multiple canonical roles for user ${membership.userId}.`);
            continue;
        }

        membershipByUserId.set(
            membership.userId,
            createMembershipRecord(membership.userId, membership.role, user),
        );
    }

    if (!membershipByUserId.has(record.ownerId)) {
        membershipByUserId.set(record.ownerId, createMembershipRecord(record.ownerId, 'OWNER', legacyOwner));
        missingCanonicalRoles.push({ businessId: record.id, userId: record.ownerId, role: 'OWNER' });
    } else if (membershipByUserId.get(record.ownerId)?.role !== 'OWNER') {
        conflicts.push(`Business ${record.id} legacy owner ${record.ownerId} conflicts with canonical role ${membershipByUserId.get(record.ownerId)?.role}.`);
    }

    for (const legacyManager of record.managers ?? []) {
        if (legacyManager.userId === record.ownerId) {
            continue;
        }

        const existing = membershipByUserId.get(legacyManager.userId);
        if (!existing) {
            membershipByUserId.set(
                legacyManager.userId,
                createMembershipRecord(legacyManager.userId, 'MANAGER', legacyManager.user ?? undefined),
            );
            missingCanonicalRoles.push({ businessId: record.id, userId: legacyManager.userId, role: 'MANAGER' });
            continue;
        }

        if (existing.role !== 'MANAGER') {
            conflicts.push(`Business ${record.id} legacy manager ${legacyManager.userId} conflicts with canonical role ${existing.role}.`);
        }
    }

    const memberships = Array.from(membershipByUserId.values()).sort((left, right) => {
        if (left.role !== right.role) {
            return left.role.localeCompare(right.role);
        }

        return left.userId.localeCompare(right.userId);
    });
    const owners = memberships.filter((membership) => membership.role === 'OWNER');

    if (owners.length !== 1) {
        conflicts.push(`Business ${record.id} must resolve to exactly one owner, found ${owners.length}.`);
    }

    return {
        ownerId: owners[0]?.userId ?? record.ownerId,
        owner: owners[0]?.user ?? legacyOwner,
        managers: memberships
            .filter((membership) => membership.role === 'MANAGER')
            .map((membership) => ({
                userId: membership.userId,
                user: membership.user,
            })),
        memberships,
        missingCanonicalRoles,
        conflicts,
    };
}

export function collectCanonicalMembershipSync(records: BusinessMembershipSourceRecord[]) {
    const missingRoleMap = new Map<string, CanonicalBusinessMembershipInput>();
    const conflicts: string[] = [];

    for (const record of records) {
        const membershipState = resolveBusinessMembershipState(record);

        membershipState.missingCanonicalRoles.forEach((membership) => {
            missingRoleMap.set(`${membership.businessId}:${membership.userId}`, membership);
        });
        conflicts.push(...membershipState.conflicts);
    }

    return {
        missingRoles: Array.from(missingRoleMap.values()),
        conflicts,
    };
}