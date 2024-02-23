import "dotenv-flow/config";
import { schema } from "./drizzle/schema";
import { userFactory } from "./factories/user";
import { postFactory } from "./factories/post";
import { SecretsManager } from "aws-sdk";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// Function to retrieve database credentials from AWS Secrets Manager
async function getDbCredentials(secretArn: string) {
  const secretsManager = new SecretsManager();
  const data = await secretsManager
    .getSecretValue({ SecretId: secretArn })
    .promise();
  return JSON.parse(data.SecretString!);
}

async function main() {
  const { DB_CONNECTION_URL, DB_SECRET_ARN } = process.env;
  const credentials = await getDbCredentials(DB_SECRET_ARN!);

  // Construct the full connection string with credentials
  const connectionString = `${DB_CONNECTION_URL}?user=${encodeURIComponent(
    credentials.username
  )}&password=${encodeURIComponent(credentials.password)}`;

  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient, { schema });

  // Create some users
  const userFactories = await userFactory.buildList(10);
  const users = await db.insert(schema.users).values(userFactories).returning();

  // Create some posts
  const postFactories = users.map((user) =>
    postFactory.build({ authorId: user.id })
  );

  await db.insert(schema.posts).values(postFactories);
}

main();
