import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
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
  footerEmail: text("footer_email"),
  privacyPolicy: text("privacy_policy"),
  shippingPolicy: text("shipping_policy"),
  returnPolicy: text("return_policy"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
  paymentMethods: text("payment_methods"),
  subscriptionStartDate: timestamp("subscription_start_date", { withTimezone: true }),
  subscriptionExpiryDate: timestamp("subscription_expiry_date", { withTimezone: true }),
  showOnLanding: boolean("show_on_landing").default(false),
  heroFeatured: boolean("hero_featured").default(false),
  permanentToken: text("permanent_token").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ id: true, createdAt: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;
