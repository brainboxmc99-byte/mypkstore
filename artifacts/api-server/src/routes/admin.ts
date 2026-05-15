import { Router, type IRouter } from "express";
import { eq, gte } from "drizzle-orm";
import crypto from "crypto";
import { db, shopsTable, plansTable, loginTokensTable, ordersTable } from "@workspace/db";
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
  ListPlansResponse,
  UpdatePlanParams,
  UpdatePlanBody,
  UpdatePlanResponse,
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
      shops.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
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
  if (parsed.data.plan !== undefined) updates.plan = parsed.data.plan;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  if (Object.keys(updates).length === 0) {
    const [shop] = await db
      .select()
      .from(shopsTable)
      .where(eq(shopsTable.id, params.data.id));
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    res.json(UpdateShopResponse.parse({ ...shop, createdAt: shop.createdAt.toISOString() }));
    return;
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

  res.json(UpdateShopResponse.parse({ ...shop, createdAt: shop.createdAt.toISOString() }));
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
