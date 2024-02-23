import { Factory } from "fishery";

import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { schema } from "../drizzle/schema";

export const userFactory = Factory.define<typeof schema.users.$inferInsert>(
  () => ({
    id: createId(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    clerkUserId: createId(),
    emailAddress: faker.internet.email(),
  })
);
