// import { createDbClient } from "@/db-helper";

export const handler = async () => {
  // const db = await createDbClient();
  // const posts = await db.query.users.findMany({
  //   limit: 10,
  // });
  const users = [
    {
      name: "user 1",
    },
    {
      name: "user 2",
    },
  ];

  // Constructing the HTTP response
  const response = {
    statusCode: 200, // HTTP status code
    headers: {
      "Content-Type": "application/json", // Ensure the client knows to expect JSON
    },
    body: JSON.stringify(users), // Convert your data object to a JSON string
  };

  return response;
};
