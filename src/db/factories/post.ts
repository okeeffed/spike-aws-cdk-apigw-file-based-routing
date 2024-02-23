import { Factory } from "fishery";

import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { schema } from "../drizzle/schema";

export const postFactory = Factory.define<typeof schema.posts.$inferInsert>(
  ({ params }) => ({
    id: createId(),
    title: faker.lorem.sentence(),
    content: "# Hello world\n\nThis is a post.",
    published: true,
    authorId: params.authorId || createId(),
  })
);
