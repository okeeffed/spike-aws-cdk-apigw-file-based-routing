import { relations } from 'drizzle-orm';
import { stripeSubscriptionPlans } from './stripe-subscription-plans';
import { organizations } from './organizations';

export const stripeSubscriptionPlansRelations = relations(stripeSubscriptionPlans, (helpers) => ({ organization: helpers.many(organizations, { relationName: 'OrganizationToStripeSubscriptionPlan' }) }));