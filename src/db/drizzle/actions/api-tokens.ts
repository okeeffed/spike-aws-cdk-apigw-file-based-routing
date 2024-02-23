import { db } from "../db";
import { schema } from "../schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

export async function insertApiToken(
  data: Omit<typeof schema.apiTokens.$inferInsert, "id">
) {
  const [result] = await db
    .insert(schema.apiTokens)
    .values({
      id: createId(),
      ...data,
    })
    .returning();

  if (!result) {
    throw new Error("Api token not created");
  }

  return result;
}

export async function findManyApiTokensByUserId(userId: string) {
  const result = await db
    .select()
    .from(schema.apiTokens)
    .where(eq(schema.apiTokens.userId, userId));

  return result;
}
