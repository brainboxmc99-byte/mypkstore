import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, loginTokensTable, shopsTable, platformSettingsTable } from "@workspace/db";
import {
  LoginWithTokenBody,
  LoginWithTokenResponse,
  AdminLoginBody,
  AdminLoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";

declare module "express-session" {
  interface SessionData {
    role?: "admin" | "shopOwner";
    shopId?: number;
  }
}

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginWithTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { token } = parsed.data;

  const [record] = await db
    .select()
    .from(loginTokensTable)
    .where(
      and(
        eq(loginTokensTable.token, token),
        eq(loginTokensTable.used, false),
        gt(loginTokensTable.expiresAt, new Date()),
      ),
    );

  let shop: typeof shopsTable.$inferSelect | undefined;

  if (record) {
    await db
      .update(loginTokensTable)
      .set({ used: true })
      .where(eq(loginTokensTable.id, record.id));

    const [s] = await db
      .select()
      .from(shopsTable)
      .where(eq(shopsTable.id, record.shopId));
    shop = s;
  } else {
    const [s] = await db
      .select()
      .from(shopsTable)
      .where(eq(shopsTable.permanentToken, token));
    shop = s;
  }

  if (!shop) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  if (shop.status !== "active") {
    res.status(403).json({ error: "Your account has been deactivated. Please contact support." });
    return;
  }

  req.session.role = "shopOwner";
  req.session.shopId = shop.id;

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session save failed" });
      return;
    }
    res.json(
      LoginWithTokenResponse.parse({
        role: "shopOwner",
        shopId: shop.id,
        shop: {
          ...shop,
          createdAt: shop.createdAt.toISOString(),
          subscriptionStartDate: shop.subscriptionStartDate?.toISOString() ?? null,
          subscriptionExpiryDate: shop.subscriptionExpiryDate?.toISOString() ?? null,
        },
      }),
    );
  });
});

router.post("/auth/admin", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settingRows = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, "adminPassword"));
  const storedPassword = settingRows[0]?.value;
  const effectivePassword = storedPassword || ADMIN_PASSWORD;

  if (parsed.data.password !== effectivePassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.role = "admin";

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session save failed" });
      return;
    }
    res.json(AdminLoginResponse.parse({ role: "admin", shopId: null }));
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const role = req.session.role;
  if (!role) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (role === "admin") {
    res.json(GetMeResponse.parse({ role: "admin", shopId: null }));
    return;
  }

  const shopId = req.session.shopId;
  if (!shopId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, shopId));

  if (!shop) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Shop not found" });
    return;
  }

  if (shop.status !== "active") {
    req.session.destroy(() => {});
    res.status(403).json({ error: "Your account has been deactivated. Please contact support." });
    return;
  }

  res.json(
    GetMeResponse.parse({
      role: "shopOwner",
      shopId: shop.id,
      shop: {
        ...shop,
        createdAt: shop.createdAt.toISOString(),
        subscriptionStartDate: shop.subscriptionStartDate?.toISOString() ?? null,
        subscriptionExpiryDate: shop.subscriptionExpiryDate?.toISOString() ?? null,
      },
    }),
  );
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

export default router;
