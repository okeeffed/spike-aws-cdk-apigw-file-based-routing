import { relations } from 'drizzle-orm';
import { users } from './users';
import { posts } from './posts';
import { memberships } from './memberships';
import { apiTokens } from './api-tokens';

export const usersRelations = relations(users, (helpers) => ({ posts: helpers.many(posts, { relationName: 'PostToUser' }), membership: helpers.many(memberships, { relationName: 'MembershipToUser' }), apiTokens: helpers.many(apiTokens, { relationName: 'ApiTokenToUser' }) }));