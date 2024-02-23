import { pgEnum } from 'drizzle-orm/pg-core';

export const subscriptionIntervalEnum = pgEnum('SubscriptionInterval', ['MONTH', 'YEAR']);