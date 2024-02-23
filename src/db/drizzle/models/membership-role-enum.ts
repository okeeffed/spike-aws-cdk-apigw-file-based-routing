import { pgEnum } from 'drizzle-orm/pg-core';

export const membershipRoleEnum = pgEnum('MembershipRole', ['OWNER', 'ADMIN', 'USER']);