import { createDbClient } from "@/db-helper";

export const handler = async () => {
  const db = await createDbClient();
  const posts = await db.query.users.findMany({
    limit: 10,
  });

  // Constructing the HTTP response
  const response = {
    statusCode: 200, // HTTP status code
    headers: {
      "Content-Type": "application/json", // Ensure the client knows to expect JSON
    },
    body: JSON.stringify(posts), // Convert your data object to a JSON string
  };

  return response;
};
