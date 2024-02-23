import { relations } from 'drizzle-orm';
import { stripeInvoices } from './stripe-invoices';
import { organizations } from './organizations';

export const stripeInvoicesRelations = relations(stripeInvoices, (helpers) => ({ organization: helpers.one(organizations, { relationName: 'OrganizationToStripeInvoice', fields: [ stripeInvoices.organizationId ], references: [ organizations.id ] }) }));