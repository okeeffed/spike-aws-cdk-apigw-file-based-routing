import * as db from "./schema";

export type OrganizationSelect = typeof db.organization.$inferSelect;
export type OrganizationInsert = typeof db.organization.$inferInsert;
export type ApiTokenSelect = typeof db.apiToken.$inferSelect;
export type ApiTokenInsert = typeof db.apiToken.$inferInsert;
