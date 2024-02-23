import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { globalRoleEnum } from './global-role-enum';

export const users = pgTable('User', { id: text('id').primaryKey(), clerkUserId: text('clerkUserId').notNull(), firstName: text('firstName').notNull(), lastName: text('lastName'), emailAddress: text('emailAddress').notNull(), role: globalRoleEnum('role').default('CUSTOMER').notNull(), createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).defaultNow().notNull(), updatedAt: timestamp('updatedAt', { mode: 'date', precision: 3 }).defaultNow().notNull() });