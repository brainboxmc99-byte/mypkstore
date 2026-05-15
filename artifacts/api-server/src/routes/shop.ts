import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  shopsTable,
  productsTable,
  ordersTable,
} from "@workspace/db";
import {
  GetMyShopResponse,
  UpdateMyShopBody,
  UpdateMyShopResponse,
  GetShopStatsResponse,
  ListMyProductsResponse,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  ListMyOrdersResponse,
  UpdateOrderParams,
  UpdateOrderBody,
  UpdateOrderResponse,
  DeleteOrderParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireShopOwner(req: any, res: any, next: any) {
  if (req.session?.role !== "shopOwner" || !req.session?.shopId) {
    res.status(401).json({ error: "Shop owner access required" });
    return;
  }
  next();
}

router.get("/shop/me", requireShopOwner, async (req, res): Promise<void> => {
  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, req.session.shopId!));

  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  res.json(GetMyShopResponse.parse({ ...shop, createdAt: shop.createdAt.toISOString() }));
});

router.patch("/shop/me", requireShopOwner, async (req, res): Promise<void> => {
  const parsed = UpdateMyShopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.shopName !== undefined) updates.shopName = parsed.data.shopName;
  if (parsed.data.tagline !== undefined) updates.tagline = parsed.data.tagline;
  if (parsed.data.whatsapp !== undefined) updates.whatsapp = parsed.data.whatsapp;
  if (parsed.data.logoUrl !== undefined) updates.logoUrl = parsed.data.logoUrl;
  if (parsed.data.bannerUrl !== undefined) updates.bannerUrl = parsed.data.bannerUrl;
  if (parsed.data.brandColor !== undefined) updates.brandColor = parsed.data.brandColor;
  if (parsed.data.footerText !== undefined) updates.footerText = parsed.data.footerText;
  if (parsed.data.footerAddress !== undefined) updates.footerAddress = parsed.data.footerAddress;
  if (parsed.data.footerPhone !== undefined) updates.footerPhone = parsed.data.footerPhone;

  const [shop] = await db
    .update(shopsTable)
    .set(updates)
    .where(eq(shopsTable.id, req.session.shopId!))
    .returning();

  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  res.json(UpdateMyShopResponse.parse({ ...shop, createdAt: shop.createdAt.toISOString() }));
});

router.get("/shop/stats", requireShopOwner, async (req, res): Promise<void> => {
  const shopId = req.session.shopId!;

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.shopId, shopId));
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  const allOrders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.shopId, shopId));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersToday = allOrders.filter(
    (o) => new Date(o.createdAt) >= today,
  ).length;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const revenueThisMonth = allOrders
    .filter((o) => new Date(o.createdAt) >= monthStart)
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;

  res.json(
    GetShopStatsResponse.parse({
      totalProducts,
      ordersToday,
      revenueThisMonth,
      lowStockCount,
      pendingOrders,
    }),
  );
});

router.get("/shop/products", requireShopOwner, async (req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.shopId, req.session.shopId!))
    .orderBy(productsTable.createdAt);

  res.json(
    ListMyProductsResponse.parse(
      products.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    ),
  );
});

router.post("/shop/products", requireShopOwner, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ ...parsed.data, shopId: req.session.shopId! })
    .returning();

  res.status(201).json({ ...product, createdAt: product.createdAt.toISOString() });
});

router.patch("/shop/products/:id", requireShopOwner, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set(parsed.data)
    .where(
      and(
        eq(productsTable.id, params.data.id),
        eq(productsTable.shopId, req.session.shopId!),
      ),
    )
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse({ ...product, createdAt: product.createdAt.toISOString() }));
});

router.delete("/shop/products/:id", requireShopOwner, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(productsTable)
    .where(
      and(
        eq(productsTable.id, params.data.id),
        eq(productsTable.shopId, req.session.shopId!),
      ),
    );

  res.sendStatus(204);
});

router.get("/shop/orders", requireShopOwner, async (req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.shopId, req.session.shopId!))
    .orderBy(ordersTable.createdAt);

  res.json(
    ListMyOrdersResponse.parse(
      orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
    ),
  );
});

router.delete("/shop/orders/:id", requireShopOwner, async (req, res): Promise<void> => {
  const params = DeleteOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(ordersTable)
    .where(
      and(
        eq(ordersTable.id, params.data.id),
        eq(ordersTable.shopId, req.session.shopId!),
      ),
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/shop/orders/:id", requireShopOwner, async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set(parsed.data)
    .where(
      and(
        eq(ordersTable.id, params.data.id),
        eq(ordersTable.shopId, req.session.shopId!),
      ),
    )
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(UpdateOrderResponse.parse({ ...order, createdAt: order.createdAt.toISOString() }));
});

export default router;
