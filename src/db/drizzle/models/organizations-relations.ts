import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { stripeSubscriptionPlans } from './stripe-subscription-plans';
import { memberships } from './memberships';
import { apiTokens } from './api-tokens';
import { stripeInvoices } from './stripe-invoices';

export const organizationsRelations = relations(organizations, (helpers) => ({ stripeSubscriptionPlan: helpers.one(stripeSubscriptionPlans, { relationName: 'OrganizationToStripeSubscriptionPlan', fields: [ organizations.stripeSubscriptionPlanId ], references: [ stripeSubscriptionPlans.id ] }), membership: helpers.many(memberships, { relationName: 'MembershipToOrganization' }), apiTokens: helpers.many(apiTokens, { relationName: 'ApiTokenToOrganization' }), invoices: helpers.many(stripeInvoices, { relationName: 'OrganizationToStripeInvoice' }) }));