import { pgTable, text } from 'drizzle-orm/pg-core';
import { membershipRoleEnum } from './membership-role-enum';

export const memberships = pgTable('Membership', { id: text('id').primaryKey(), clerkOrganizationMembershipId: text('clerkOrganizationMembershipId').notNull(), role: membershipRoleEnum('role').notNull(), organizationId: text('organizationId').notNull(), userId: text('userId') });