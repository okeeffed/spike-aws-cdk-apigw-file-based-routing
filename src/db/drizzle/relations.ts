import { organization, stripeSubscriptionPlan } from "./schema";
import { relations } from "drizzle-orm";

export const organizationRelations = relations(organization, ({ one }) => ({
  stripeSubscriptionPlan: one(stripeSubscriptionPlan),
}));
