import { relations } from 'drizzle-orm';
import { posts } from './posts';
import { users } from './users';

export const postsRelations = relations(posts, (helpers) => ({ author: helpers.one(users, { relationName: 'PostToUser', fields: [ posts.authorId ], references: [ users.id ] }) }));