import { pgEnum } from 'drizzle-orm/pg-core';

export const subscriptionTierEnum = pgEnum('SubscriptionTier', ['FREE', 'BASIC', 'PRO', 'ENTERPRISE']);