import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { schema } from "./schema";

// Schema for inserting a user - can be used to validate API requests
export const insertUserSchema = createInsertSchema(schema.users);

// Schema for selecting a user - can be used to validate API responses
export const selectUserSchema = createSelectSchema(schema.users);

// Schema for inserting a post - can be used to validate API requests
export const insertPostSchema = createInsertSchema(schema.posts);

// Schema for selecting a post - can be used to validate API responses
export const selectPostSchema = createSelectSchema(schema.posts);

// API Tokens
export const insertApiTokenSchema = createInsertSchema(schema.apiTokens);
export const selectApiTokenSchema = createSelectSchema(schema.apiTokens);
