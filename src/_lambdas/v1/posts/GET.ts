import { SecretsManager } from "aws-sdk";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres = require("postgres");
import { schema } from "@/db";

// Function to retrieve database credentials from AWS Secrets Manager
async function getDbCredentials(secretArn: string) {
  const secretsManager = new SecretsManager();
  const data = await secretsManager
    .getSecretValue({ SecretId: secretArn })
    .promise();
  return JSON.parse(data.SecretString!);
}

export const handler = async () => {
  const { DB_CONNECTION_URL, DB_SECRET_ARN } = process.env;
  const credentials = await getDbCredentials(DB_SECRET_ARN!);

  // Construct the full connection string with credentials
  const connectionString = `${DB_CONNECTION_URL}?user=${encodeURIComponent(
    credentials.username
  )}&password=${encodeURIComponent(credentials.password)}`;

  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient, { schema });

  const posts = await db.query.posts.findMany({
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
