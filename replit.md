# MyPkStore

A multi-tenant SaaS platform for Pakistani small shop owners. Super Admins manage up to 50 shops, issue magic-link QR codes, and control subscription plans. Shop owners manage products, inventory and orders. Customers browse a public storefront and place orders via WhatsApp.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — express-session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + connect-pg-simple (session persistence in Postgres)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) → `lib/api-client-react`, `lib/api-zod`
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + shadcn/ui + Tailwind v4 + wouter + React Query
- File uploads: multer (stored in `dist/public/uploads/`, served at `/uploads/`)
- QR codes: qrcode.react (for magic link QR codes in admin panel)

## Where things live

- `lib/db/src/schema/` — Drizzle schema: shops, products, orders, plans, login_tokens
- `lib/api-spec/openapi.yaml` — OpenAPI 3.1 source of truth (777 lines)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod validators
- `artifacts/api-server/src/routes/` — auth, admin, shop, store, upload route handlers
- `artifacts/mypkstore/src/pages/` — admin-login, admin-dashboard, shop-login, shop-dashboard, public-store
- `artifacts/mypkstore/src/components/image-upload.tsx` — reusable image upload with URL or file input

## Architecture decisions

- Sessions are stored in Postgres via `connect-pg-simple` (same DB, `session` table auto-created)
- Admin auth: password-based (`ADMIN_PASSWORD` env, default `admin123`), stored only in session
- Shop owner auth: magic link tokens (single-use, 7-day expiry) stored in `login_tokens` table; link includes full domain so it works as a QR code scan
- Upload files land in `dist/public/uploads/` and are served statically at `/uploads/`; URLs point back to the platform domain
- Plans are seeded via SQL at setup time (Basic/Pro/Business); admins can update prices/limits/features in-panel

## Product

- **Super Admin** (`/`): password login → dashboard with platform stats, shop management (create/edit/delete/toggle status), magic QR link generation per shop, plan price & feature editing
- **Shop Owner** (`/login?token=…`): magic link → dashboard with product CRUD (with image upload), order tracking & status management, shop branding settings (logo, banner, color, footer)
- **Public Store** (`/store/:slug`): hero banner with brand color, product grid, WhatsApp order flow with customer details form

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Upload directory (`dist/public/uploads/`) is created at runtime by `upload.ts` if missing; it is NOT inside the repo
- Magic link domain uses `APP_DOMAIN` env first, then `REPLIT_DEV_DOMAIN`, then falls back to `localhost`
- The `ADMIN_PASSWORD` env var defaults to `admin123` — change it in production
- Plans table must be seeded manually; SQL: `INSERT INTO plans (name, price, product_limit, features) VALUES ...`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
