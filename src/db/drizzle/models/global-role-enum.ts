import { pgEnum } from 'drizzle-orm/pg-core';

export const globalRoleEnum = pgEnum('GlobalRole', ['SUPERADMIN', 'CUSTOMER']);