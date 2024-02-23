import { pgTable, text, boolean } from 'drizzle-orm/pg-core';

export const posts = pgTable('Post', { id: text('id').primaryKey(), title: text('title').notNull(), content: text('content'), published: boolean('published').default(false).notNull(), authorId: text('authorId').notNull() });