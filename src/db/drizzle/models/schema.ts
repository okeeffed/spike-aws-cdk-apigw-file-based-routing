import * as users from './users';
import * as organizations from './organizations';
import * as stripeSubscriptionPlans from './stripe-subscription-plans';
import * as stripeInvoices from './stripe-invoices';
import * as memberships from './memberships';
import * as posts from './posts';
import * as apiTokens from './api-tokens';
import * as usersRelations from './users-relations';
import * as organizationsRelations from './organizations-relations';
import * as stripeSubscriptionPlansRelations from './stripe-subscription-plans-relations';
import * as stripeInvoicesRelations from './stripe-invoices-relations';
import * as membershipsRelations from './memberships-relations';
import * as postsRelations from './posts-relations';
import * as apiTokensRelations from './api-tokens-relations';

export const schema = { ...users, ...organizations, ...stripeSubscriptionPlans, ...stripeInvoices, ...memberships, ...posts, ...apiTokens, ...usersRelations, ...organizationsRelations, ...stripeSubscriptionPlansRelations, ...stripeInvoicesRelations, ...membershipsRelations, ...postsRelations, ...apiTokensRelations };