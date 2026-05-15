import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, shopsTable, productsTable, ordersTable } from "@workspace/db";
import {
  GetPublicStoreParams,
  GetPublicStoreResponse,
  ListPublicProductsParams,
  ListPublicProductsResponse,
  SubmitOrderParams,
  SubmitOrderBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

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
