import { pgTable, text } from "drizzle-orm/pg-core";

export const platformSettingsTable = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export type PlatformSetting = typeof platformSettingsTable.$inferSelect;
