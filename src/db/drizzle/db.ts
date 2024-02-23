import { drizzle } from "drizzle-orm/postgres-js";
import { schema } from "./schema";
import postgres = require("postgres");

const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });
