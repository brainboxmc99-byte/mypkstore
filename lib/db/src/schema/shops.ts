import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopsTable = pgTable("shops", {
  id: serial("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  shopName: text("shop_name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("Basic"),
  status: text("status").notNull().default("active"),
  whatsapp: text("whatsapp").notNull(),
  tagline: text("tagline"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  brandColor: text("brand_color"),
  footerText: text("footer_text"),
  footerAddress: text("footer_address"),
  footerPhone: text("footer_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ id: true, createdAt: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;
