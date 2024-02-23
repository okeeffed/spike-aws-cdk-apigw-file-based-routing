import { relations } from 'drizzle-orm';
import { apiTokens } from './api-tokens';
import { organizations } from './organizations';
import { users } from './users';

export const apiTokensRelations = relations(apiTokens, (helpers) => ({ organization: helpers.one(organizations, { relationName: 'ApiTokenToOrganization', fields: [ apiTokens.organizationId ], references: [ organizations.id ] }), user: helpers.one(users, { relationName: 'ApiTokenToUser', fields: [ apiTokens.userId ], references: [ users.id ] }) }));