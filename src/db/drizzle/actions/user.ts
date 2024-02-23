import { db } from "../db";

import { schema } from "../schema";
import { eq, and, sql } from "drizzle-orm";

export async function findUserMembershipsByUserId({
  userId,
}: {
  userId: string;
}) {
  const results = await db
    .select()
    .from(schema.memberships)
    .leftJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
    .leftJoin(
      schema.organizations,
      eq(schema.memberships.organizationId, schema.organizations.id)
    )
    .leftJoin(
      schema.stripeSubscriptionPlans,
      eq(
        schema.organizations.stripeSubscriptionPlanId,
        schema.stripeSubscriptionPlans.id
      )
    )
    .where(and(eq(schema.memberships.userId, userId)));

  const transformedResults = results.map((result) => ({
    user: result.User,
    organization: result.Organization,
    membership: result.Membership,
    stripeSubscriptionPlan: result.StripeSubscriptionPlan,
  }));

  return transformedResults;
}

// Find all active stripe subscription plans
export async function findUserAndOrgByClerkIds({
  clerkUserId,
  clerkOrganizationId,
}: {
  clerkUserId: string;
  clerkOrganizationId: string;
}) {
  const [result] = await db
    .select()
    .from(schema.users)
    .leftJoin(
      schema.memberships,
      eq(schema.users.id, schema.memberships.userId)
    )
    .leftJoin(
      schema.organizations,
      eq(schema.memberships.organizationId, schema.organizations.id)
    )
    .leftJoin(
      schema.stripeSubscriptionPlans,
      eq(
        schema.organizations.stripeSubscriptionPlanId,
        schema.stripeSubscriptionPlans.id
      )
    )
    .where(
      and(
        eq(schema.users.clerkUserId, clerkUserId),
        eq(schema.organizations.clerkOrganizationId, clerkOrganizationId)
      )
    );

  if (!result) {
    throw new Error("User and org not found");
  }

  return {
    user: result.User,
    organization: result.Organization,
    membership: result.Membership,
    stripeSubscriptionPlan: result.StripeSubscriptionPlan,
  };
}

export async function findUserAndOrgByIds({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  const [result] = await db
    .select()
    .from(schema.users)
    .leftJoin(
      schema.memberships,
      eq(schema.users.id, schema.memberships.userId)
    )
    .leftJoin(
      schema.organizations,
      eq(schema.memberships.organizationId, schema.organizations.id)
    )
    .leftJoin(
      schema.stripeSubscriptionPlans,
      eq(
        schema.organizations.stripeSubscriptionPlanId,
        schema.stripeSubscriptionPlans.id
      )
    )
    .where(
      and(
        eq(schema.users.id, userId),
        eq(schema.organizations.id, organizationId)
      )
    );

  if (!result) {
    throw new Error("User and org not found");
  }

  return {
    user: result.User,
    organization: result.Organization,
    membership: result.Membership,
    stripeSubscriptionPlan: result.StripeSubscriptionPlan,
  };
}

export async function findUniqueUserById({ userId }: { userId: string }) {
  const [result] = await db.execute<typeof schema.users.$inferSelect>(
    sql`SELECT * FROM ${schema.users} WHERE ${schema.users.id} = ${userId}`
  );

  if (!result) {
    return {
      success: false,
      message: "User not found",
    };
  }

  return {
    success: true,
    data: result,
  };
}

export async function findUniqueUserByClerkUserId({
  clerkUserId,
}: {
  clerkUserId: string;
}) {
  const [result] = await db.execute<typeof schema.users.$inferSelect>(
    sql`SELECT * FROM ${schema.users} WHERE ${schema.users.clerkUserId} = ${clerkUserId}`
  );

  if (!result) {
    return {
      success: false,
      message: "User not found",
    };
  }

  return {
    success: true,
    data: result,
  };
}
