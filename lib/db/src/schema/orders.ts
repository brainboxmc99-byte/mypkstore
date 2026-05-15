import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  address: text("address"),
  productName: text("product_name").notNull(),
  note: text("note"),
  total: integer("total").notNull().default(0),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
