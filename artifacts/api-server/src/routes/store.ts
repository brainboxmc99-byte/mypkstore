import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, shopsTable, productsTable, ordersTable, plansTable, platformSettingsTable } from "@workspace/db";
import {
  GetPublicStoreParams,
  GetPublicStoreResponse,
  ListPublicProductsParams,
  ListPublicProductsResponse,
  SubmitOrderParams,
  SubmitOrderBody,
  ListPublicPlansResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/plans", async (_req, res): Promise<void> => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.id);
  res.json(ListPublicPlansResponse.parse(plans));
});

router.get("/settings/public", async (_req, res): Promise<void> => {
  const rows = await db.select().from(platformSettingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  res.json({
    whatsappNumber: map["whatsappNumber"] ?? "",
    contactEmail: map["contactEmail"] ?? "",
    contactAddress: map["contactAddress"] ?? "",
    contactPhone: map["contactPhone"] ?? "",
    privacyPolicy: map["privacyPolicy"] ?? "",
    shippingPolicy: map["shippingPolicy"] ?? "",
    returnPolicy: map["returnPolicy"] ?? "",
    facebookUrl: map["facebookUrl"] ?? "",
    instagramUrl: map["instagramUrl"] ?? "",
    twitterUrl: map["twitterUrl"] ?? "",
    youtubeUrl: map["youtubeUrl"] ?? "",
    paymentMethods: map["paymentMethods"] ?? "",
  });
});

router.get("/hero-store", async (_req, res): Promise<void> => {
  const now = new Date();
  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(and(eq(shopsTable.status, "active"), eq(shopsTable.heroFeatured, true)))
    .orderBy(shopsTable.id);
  if (!shop || (shop.subscriptionExpiryDate && new Date(shop.subscriptionExpiryDate) < now)) {
    res.json(null);
    return;
  }
  res.json({
    id: shop.id,
    shopName: shop.shopName,
    slug: shop.slug,
    bannerUrl: shop.bannerUrl,
    logoUrl: shop.logoUrl,
    tagline: shop.tagline,
  });
});
router.get("/featured-stores", async (_req, res): Promise<void> => {
  const now = new Date();
  const shops = await db
    .select()
    .from(shopsTable)
    .where(and(eq(shopsTable.status, "active"), eq(shopsTable.showOnLanding, true)));
  // Filter out expired, return only public-safe fields
  const featured = shops
    .filter((s) => !s.subscriptionExpiryDate || new Date(s.subscriptionExpiryDate) >= now)
    .map((s) => ({
      id: s.id,
      shopName: s.shopName,
      slug: s.slug,
      bannerUrl: s.bannerUrl,
      logoUrl: s.logoUrl,
      tagline: s.tagline,
    }));
  res.json(featured);
});
router.get("/stores/:slug", async (req, res): Promise<void> => {
  const params = GetPublicStoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.slug, params.data.slug));

  if (!shop || shop.status !== "active") {
    res.status(404).json({ error: "Store not found" });
    return;
  }
  // Block access if subscription has expired
  if (shop.subscriptionExpiryDate && new Date(shop.subscriptionExpiryDate) < new Date()) {
    res.status(404).json({ error: "Store subscription expired" });
    return;
  }

  res.json(
    GetPublicStoreResponse.parse({
      id: shop.id,
      shopName: shop.shopName,
      slug: shop.slug,
      whatsapp: shop.whatsapp,
      tagline: shop.tagline,
      logoUrl: shop.logoUrl,
      bannerUrl: shop.bannerUrl,
      brandColor: shop.brandColor,
      footerText: shop.footerText,
      footerAddress: shop.footerAddress,
      footerPhone: shop.footerPhone,
      footerEmail: shop.footerEmail,
      privacyPolicy: shop.privacyPolicy,
      shippingPolicy: shop.shippingPolicy,
      returnPolicy: shop.returnPolicy,
      facebookUrl: shop.facebookUrl,
      instagramUrl: shop.instagramUrl,
      twitterUrl: shop.twitterUrl,
      youtubeUrl: shop.youtubeUrl,
      paymentMethods: shop.paymentMethods,
    }),
  );
});

router.get("/stores/:slug/products", async (req, res): Promise<void> => {
  const params = ListPublicProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.slug, params.data.slug));

  if (!shop || shop.status !== "active") {
    res.status(404).json({ error: "Store not found" });
    return;
  }
  // Block access if subscription has expired
  if (shop.subscriptionExpiryDate && new Date(shop.subscriptionExpiryDate) < new Date()) {
    res.status(404).json({ error: "Store subscription expired" });
    return;
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.shopId, shop.id))
    .orderBy(productsTable.createdAt);

  res.json(
    ListPublicProductsResponse.parse(
      products.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    ),
  );
});

router.post("/stores/:slug/orders", async (req, res): Promise<void> => {
  const params = SubmitOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.slug, params.data.slug));

  if (!shop || shop.status !== "active") {
    res.status(404).json({ error: "Store not found" });
    return;
  }
  // Block access if subscription has expired
  if (shop.subscriptionExpiryDate && new Date(shop.subscriptionExpiryDate) < new Date()) {
    res.status(404).json({ error: "Store subscription expired" });
    return;
  }

  const [order] = await db
    .insert(ordersTable)
    .values({
      shopId: shop.id,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      address: parsed.data.address,
      productName: parsed.data.productName,
      note: parsed.data.note,
      total: parsed.data.total ?? 0,
      status: "pending",
    })
    .returning();

  res.status(201).json({ ...order, createdAt: order.createdAt.toISOString() });
});

export default router;
