import { eq } from "drizzle-orm";
import { db } from "../db";
import { schema } from "../schema";

// Find all active stripe subscription plans
export async function queryActiveStripeSubscriptionPlans() {
  const result = await db.query.stripeSubscriptionPlans.findMany({
    where: eq(schema.stripeSubscriptionPlans.active, true),
  });

  return result;
}
