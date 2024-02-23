import { db } from "../db";
import { OrganizationInsert } from "../types";
import { schema } from "../schema";
import { eq } from "drizzle-orm";

// Find all active stripe subscription plans
export async function findFirstOrgWithStripeSubscriptionPlans({
  name,
}: {
  name: string;
}) {
  const [result] = await db
    .select()
    .from(schema.organizations)
    .leftJoin(
      schema.stripeSubscriptionPlans,
      eq(
        schema.organizations.stripeSubscriptionPlanId,
        schema.stripeSubscriptionPlans.id
      )
    )
    .where(eq(schema.organizations.name, name));

  return result;
}

export async function updateOrganization(
  id: string,
  data: Pick<OrganizationInsert, "stripeCustomerId" | "stripeSubscriptionId">
) {
  const result = await db
    .update(schema.organizations)
    .set(data)
    .where(eq(schema.organizations.id, id));

  return result;
}
