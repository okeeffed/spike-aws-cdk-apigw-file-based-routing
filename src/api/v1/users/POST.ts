// import { createDbClient } from "@/db-helper";
// import { schema } from "@/db/drizzle/schema";
// import { createId } from "@paralleldrive/cuid2";

export const handler = async () => {
  // const db = await createDbClient();
  // // Create new post
  // const [newPost] = await db
  //   .insert(schema.posts)
  //   .values({
  //     id: createId(),
  //     title: "My first post",
  //     content: "This is my first post",
  //     published: true,
  //     // This is just a placeholder. It's not a real id.
  //     authorId: createId(),
  //   })
  //   .returning();

  // Constructing the HTTP response
  const response = {
    statusCode: 201, // HTTP status code
    headers: {
      "Content-Type": "application/json", // Ensure the client knows to expect JSON
    },
    // body: JSON.stringify(newPost), // Convert your data object to a JSON string
  };

  return response;
};
