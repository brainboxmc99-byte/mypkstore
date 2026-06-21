import { Router, type IRouter } from "express";
import { eq, gte } from "drizzle-orm";
import crypto from "crypto";
import { db, shopsTable, plansTable, loginTokensTable, ordersTable, platformSettingsTable } from "@workspace/db";
import {
  GetAdminStatsResponse,
  ListAdminShopsResponse,
  CreateShopBody,
  UpdateShopParams,
  UpdateShopBody,
  UpdateShopResponse,
  DeleteShopParams,
  GenerateTokenParams,
  GenerateTokenResponse,
  GeneratePermanentTokenParams,
  GeneratePermanentTokenResponse,
  ListPlansResponse,
  UpdatePlanParams,
  UpdatePlanBody,
  UpdatePlanResponse,
  GetAdminSettingsResponse,
  UpdateAdminSettingsBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (req.session?.role !== "admin") {
    res.status(401).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const shops = await db.select().from(shopsTable);
  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.status === "active").length;
  const basicCount = shops.filter((s) => s.plan === "Basic").length;
  const proCount = shops.filter((s) => s.plan === "Pro").length;
  const businessCount = shops.filter((s) => s.plan === "Business").length;
  const slotsFree = Math.max(0, 50 - totalShops);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const orders = await db
    .select()
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, today));
  const ordersToday = orders.length;

  const plans = await db.select().from(plansTable);
  const planPriceMap: Record<string, number> = {};
  for (const p of plans) planPriceMap[p.name] = p.price ?? 0;
  const activeShopsList = shops.filter((s) => s.status === "active");
  const totalRevenue = activeShopsList.reduce(
    (sum, s) => sum + (planPriceMap[s.plan ?? ""] ?? 0),
    0,
  );

  res.json(
    GetAdminStatsResponse.parse({
      totalShops,
      activeShops,
      ordersToday,
      totalRevenue,
      slotsFree,
      basicCount,
      proCount,
      businessCount,
    }),
  );
});

router.get("/admin/shops", requireAdmin, async (req, res): Promise<void> => {
  const shops = await db
    .select()
    .from(shopsTable)
    .orderBy(shopsTable.createdAt);

  res.json(
    ListAdminShopsResponse.parse(
      shops.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        subscriptionStartDate: s.subscriptionStartDate?.toISOString() ?? null,
        subscriptionExpiryDate: s.subscriptionExpiryDate?.toISOString() ?? null,
      })),
    ),
  );
});

router.post("/admin/shops", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateShopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.slug, parsed.data.slug));
  if (existing) {
    res.status(400).json({ error: "Slug already taken" });
    return;
  }

  const [shop] = await db
    .insert(shopsTable)
    .values({
      ownerName: parsed.data.ownerName,
      shopName: parsed.data.shopName,
      slug: parsed.data.slug,
      whatsapp: parsed.data.whatsapp,
      plan: parsed.data.plan ?? "Basic",
      status: "active",
    })
    .returning();

  res.status(201).json({ ...shop, createdAt: shop.createdAt.toISOString() });
});

router.patch("/admin/shops/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateShopParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateShopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.shopName !== undefined) updates.shopName = parsed.data.shopName;
  if (parsed.data.ownerName !== undefined) updates.ownerName = parsed.data.ownerName;
  if (parsed.data.whatsapp !== undefined) updates.whatsapp = parsed.data.whatsapp;
  if (parsed.data.plan !== undefined) updates.plan = parsed.data.plan;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.subscriptionStartDate !== undefined)
    updates.subscriptionStartDate = parsed.data.subscriptionStartDate ? new Date(parsed.data.subscriptionStartDate) : null;
  if (parsed.data.subscriptionExpiryDate !== undefined)
    updates.subscriptionExpiryDate = parsed.data.subscriptionExpiryDate ? new Date(parsed.data.subscriptionExpiryDate) : null;
  if (parsed.data.showOnLanding !== undefined) updates.showOnLanding = parsed.data.showOnLanding;
  if (parsed.data.heroFeatured !== undefined) updates.heroFeatured = parsed.data.heroFeatured;

  if (Object.keys(updates).length === 0) {
    const [shop] = await db
      .select()
      .from(shopsTable)
      .where(eq(shopsTable.id, params.data.id));
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    res.json(UpdateShopResponse.parse({ ...shop, createdAt: shop.createdAt.toISOString(), subscriptionStartDate: shop.subscriptionStartDate?.toISOString() ?? null, subscriptionExpiryDate: shop.subscriptionExpiryDate?.toISOString() ?? null }));
    return;
  }

  // Only one hero store allowed: if turning this one ON, turn all others OFF first
  if (updates.heroFeatured === true) {
    await db.update(shopsTable).set({ heroFeatured: false });
  }
  const [shop] = await db
    .update(shopsTable)
    .set(updates)
    .where(eq(shopsTable.id, params.data.id))
    .returning();

  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  res.json(UpdateShopResponse.parse({ ...shop, createdAt: shop.createdAt.toISOString(), subscriptionStartDate: shop.subscriptionStartDate?.toISOString() ?? null, subscriptionExpiryDate: shop.subscriptionExpiryDate?.toISOString() ?? null }));
});

router.delete("/admin/shops/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteShopParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(shopsTable).where(eq(shopsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/admin/shops/:id/token", requireAdmin, async (req, res): Promise<void> => {
  const params = GenerateTokenParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, params.data.id));

  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(loginTokensTable).values({
    shopId: shop.id,
    token,
    used: false,
    expiresAt,
  });

  const domain = process.env.APP_DOMAIN ?? process.env.REPLIT_DEV_DOMAIN ?? "localhost";
  const magicLink = `https://${domain}/login?token=${token}`;

  res.json(
    GenerateTokenResponse.parse({
      token,
      shopId: shop.id,
      magicLink,
    }),
  );
});

router.post("/admin/shops/:id/permanent-token", requireAdmin, async (req, res): Promise<void> => {
  const params = GeneratePermanentTokenParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, params.data.id));

  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  let token = shop.permanentToken;
  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    await db
      .update(shopsTable)
      .set({ permanentToken: token })
      .where(eq(shopsTable.id, shop.id));
  }

  const domain = process.env.APP_DOMAIN ?? process.env.REPLIT_DEV_DOMAIN ?? "localhost";
  const permanentLink = `https://${domain}/login?token=${token}`;

  res.json(
    GeneratePermanentTokenResponse.parse({
      token,
      shopId: shop.id,
      permanentLink,
    }),
  );
});

router.get("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db.select().from(platformSettingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  res.json(GetAdminSettingsResponse.parse({
    whatsappNumber: map["whatsappNumber"] ?? "",
    contactEmail: map["contactEmail"] ?? null,
    contactAddress: map["contactAddress"] ?? null,
    contactPhone: map["contactPhone"] ?? null,
    privacyPolicy: map["privacyPolicy"] ?? null,
    shippingPolicy: map["shippingPolicy"] ?? null,
    returnPolicy: map["returnPolicy"] ?? null,
    facebookUrl: map["facebookUrl"] ?? null,
    instagramUrl: map["instagramUrl"] ?? null,
    twitterUrl: map["twitterUrl"] ?? null,
    youtubeUrl: map["youtubeUrl"] ?? null,
    paymentMethods: map["paymentMethods"] ?? null,
  }));
});

router.patch("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Array<{ key: string; value: string }> = [];
  if (parsed.data.whatsappNumber !== undefined)
    updates.push({ key: "whatsappNumber", value: parsed.data.whatsappNumber });
  if (parsed.data.contactEmail !== undefined)
    updates.push({ key: "contactEmail", value: parsed.data.contactEmail });
  if (parsed.data.contactAddress !== undefined)
    updates.push({ key: "contactAddress", value: parsed.data.contactAddress });
  if (parsed.data.contactPhone !== undefined)
    updates.push({ key: "contactPhone", value: parsed.data.contactPhone });
  if (parsed.data.privacyPolicy !== undefined)
    updates.push({ key: "privacyPolicy", value: parsed.data.privacyPolicy });
  if (parsed.data.shippingPolicy !== undefined)
    updates.push({ key: "shippingPolicy", value: parsed.data.shippingPolicy });
  if (parsed.data.returnPolicy !== undefined)
    updates.push({ key: "returnPolicy", value: parsed.data.returnPolicy });
  if (parsed.data.facebookUrl !== undefined)
    updates.push({ key: "facebookUrl", value: parsed.data.facebookUrl });
  if (parsed.data.instagramUrl !== undefined)
    updates.push({ key: "instagramUrl", value: parsed.data.instagramUrl });
  if (parsed.data.twitterUrl !== undefined)
    updates.push({ key: "twitterUrl", value: parsed.data.twitterUrl });
  if (parsed.data.youtubeUrl !== undefined)
    updates.push({ key: "youtubeUrl", value: parsed.data.youtubeUrl });
  if (parsed.data.paymentMethods !== undefined)
    updates.push({ key: "paymentMethods", value: parsed.data.paymentMethods });

  for (const u of updates) {
    await db
      .insert(platformSettingsTable)
      .values({ key: u.key, value: u.value })
      .onConflictDoUpdate({ target: platformSettingsTable.key, set: { value: u.value } });
  }

  const rows = await db.select().from(platformSettingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  res.json(GetAdminSettingsResponse.parse({
    whatsappNumber: map["whatsappNumber"] ?? "",
    contactEmail: map["contactEmail"] ?? null,
    contactAddress: map["contactAddress"] ?? null,
    contactPhone: map["contactPhone"] ?? null,
    privacyPolicy: map["privacyPolicy"] ?? null,
    shippingPolicy: map["shippingPolicy"] ?? null,
    returnPolicy: map["returnPolicy"] ?? null,
    facebookUrl: map["facebookUrl"] ?? null,
    instagramUrl: map["instagramUrl"] ?? null,
    twitterUrl: map["twitterUrl"] ?? null,
    youtubeUrl: map["youtubeUrl"] ?? null,
    paymentMethods: map["paymentMethods"] ?? null,
  }));
});

router.post("/admin/change-password", requireAdmin, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const rows = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, "adminPassword"));
  const storedPassword = rows[0]?.value;
  const ADMIN_PASSWORD_ENV = process.env.ADMIN_PASSWORD ?? "admin123";
  const effectivePassword = storedPassword || ADMIN_PASSWORD_ENV;

  if (currentPassword !== effectivePassword) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  await db
    .insert(platformSettingsTable)
    .values({ key: "adminPassword", value: newPassword })
    .onConflictDoUpdate({ target: platformSettingsTable.key, set: { value: newPassword } });

  res.json({ success: true });
});

router.get("/admin/plans", requireAdmin, async (req, res): Promise<void> => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.id);
  res.json(ListPlansResponse.parse(plans));
});

router.patch("/admin/plans/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdatePlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.price !== undefined) updates.price = parsed.data.price;
  if (parsed.data.comparePrice !== undefined) updates.comparePrice = parsed.data.comparePrice;
  if (parsed.data.productLimit !== undefined) updates.productLimit = parsed.data.productLimit;
  if (parsed.data.features !== undefined) updates.features = parsed.data.features;

  const [plan] = await db
    .update(plansTable)
    .set(updates)
    .where(eq(plansTable.id, params.data.id))
    .returning();

  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  res.json(UpdatePlanResponse.parse(plan));
});

export default router;
