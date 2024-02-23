import { pgEnum } from 'drizzle-orm/pg-core';

export const tokenStateEnum = pgEnum('TokenState', ['VALID', 'SUSPENDED', 'ARCHIVED', 'EXPIRED']);