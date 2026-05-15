import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";

export const loginTokensTable = pgTable("login_tokens", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLoginTokenSchema = createInsertSchema(loginTokensTable).omit({ id: true, createdAt: true });
export type InsertLoginToken = z.infer<typeof insertLoginTokenSchema>;
export type LoginToken = typeof loginTokensTable.$inferSelect;
