import { relations } from 'drizzle-orm';
import { memberships } from './memberships';
import { organizations } from './organizations';
import { users } from './users';

export const membershipsRelations = relations(memberships, (helpers) => ({ organization: helpers.one(organizations, { relationName: 'MembershipToOrganization', fields: [ memberships.organizationId ], references: [ organizations.id ] }), user: helpers.one(users, { relationName: 'MembershipToUser', fields: [ memberships.userId ], references: [ users.id ] }) }));