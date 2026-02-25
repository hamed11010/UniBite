# UniBite Current State Snapshot

Last updated: 2026-02-22 (workspace audit)
Workspace: `C:\Users\ahmed\Desktop\UniBite`

## 1. High-level current position

You currently have a full-stack UniBite codebase with:
- A Next.js 14 App Router frontend (`app/`).
- A NestJS + Prisma backend (`backend/`).
- Cookie-based auth and role-based routing working in code.
- Student, restaurant admin, and super admin flows implemented in real API code.
- i18n system (English + Arabic) implemented in frontend.
- Governance/reporting and order lifecycle logic implemented in backend.

Your repository is also in an active in-progress state:
- `40` modified files
- `92` untracked files
- `3` deleted files
- Many docs are older than current code behavior.

## 2. What is actually built today

### Frontend (real, connected to backend)
- University selection fetches active universities from backend.
- Login/signup use backend auth endpoints.
- Auth session uses httpOnly cookie (`checkAuth()` uses `/auth/me`).
- Student can:
  - Browse restaurants by university.
  - View menu by category.
  - Build cart with extras/comments.
  - Place order with `COUNTER` or `CARD`.
  - Track order status.
  - Confirm delivered counter orders as completed.
  - Submit reports and confirm resolved reports.
  - View active/past orders and reports.
- Restaurant admin can:
  - Manage incoming/today order queues.
  - Move statuses (`RECEIVED -> PREPARING -> READY -> DELIVERED_TO_STUDENT`).
  - Cancel orders with restricted reasons.
  - View and resolve reports.
  - Manage menu categories/products/extras/stock.
  - Update settings (open/close, working hours, max concurrency).
- Super admin can:
  - Manage universities (CRUD + enable/disable).
  - Create restaurants with admin credentials.
  - View monthly orders with filters/pagination.
  - Configure global settings (service fee, ordering toggle, maintenance mode/message).
  - View service fee analytics.
  - View escalated reports and auto-disabled restaurants.
  - Re-enable disabled restaurants.

### Backend (real, substantial domain logic)
- Auth module with signup/login/logout/me/change-password.
- Users module with profile + language update endpoints.
- University module with admin CRUD + active public listing.
- Restaurant module with creation, settings, public availability, auto-disable insights, re-enable.
- Menu module with category/product CRUD and public menu output.
- Order module with:
  - Strict creation validations (availability, maintenance, limits, stock, payment validation).
  - State machine and role-based transitions.
  - POS reference updates.
  - Restaurant/admin order list filters + pagination.
  - Service fee analytics.
  - Background timeout auto-cancel for stale ready counter orders.
- Report module with:
  - Student report creation.
  - Restaurant resolve.
  - Student confirm.
  - Auto-escalation scheduler.
  - Three-strike auto-disable logic.

### Database model (Prisma)
- Core models: `University`, `User`, `Restaurant`, `Category`, `Product`, `ProductExtra`, `Order`, `OrderItem`, `GlobalConfig`, `Report`.
- Enums include role, order status, payment method, payment status, refund status, report statuses/types, cancellation reasons.
- Migrations exist through user profile fields and order/governance/payment features.

## 3. Important reality checks and inconsistencies

- Root `README.md` still describes old frontend-only/mock status; code is now backend-integrated.
- `MANUAL_ACTIONS.md` and `PROJECT_STRUCTURE.md` include mixed old/new statements.
- Root frontend `npm run dev` defaults to port `3000`, but backend CORS allows `3001` only in `backend/src/main.ts`.
- Backend README still mentions backend on `3000`, but current backend code listens on `4000`.
- `app/layout.tsx` uses `/logo-icon.svg` as icon metadata; old favicon/manifest assumptions still exist in docs.
- `public/icon-192.png`, `public/icon-512.png`, and `public/manifest.json` are deleted in git status.
- There is an anomalous tracked zero-byte file:
  - Filesystem name shown as `backend/prismaschema.prisma60`
  - Git path escaped form: `"backend/prismaschema.prisma\357\200\27260"`
- `.github/` exists but currently contains empty folders only (`.github/appmod`, `.github/appmod/appcat`).
- Test output artifacts indicate failing/incomplete e2e tests (`backend/test_output.txt`, `backend/test_output_2.txt`).

## 4. Architecture and flow summary

### Auth/session
- Backend sets `access_token` cookie on login.
- Frontend does not rely on localStorage for auth token.
- `lib/auth.ts` uses `/auth/me` for session truth.

### Role shell/layout
- `RoleShell` + `RoleSidebar` provide shared shell/navigation.
- Role-specific route guards are implemented in:
  - `app/student/layout.tsx`
  - `app/restaurant/layout.tsx`
  - `app/admin/layout.tsx`
  - `app/orders/layout.tsx`
- `ProtectedRolePage` is used for authenticated pages (`/profile`, `/settings`, `/about`).

### i18n
- `LanguageProvider` + `lib/i18n.ts` + `lib/language.ts`.
- Locale dictionaries in `locales/en.json` and `locales/ar.json`.
- `lang`/`dir` are applied at document level.

### Orders/governance
- Order lifecycle includes explicit statuses and timestamps (`readyAt`, `deliveredAt`, `completedAt`).
- Counter orders can block new orders until student confirms delivery completion.
- Reports move through `PENDING -> RESOLVED_BY_RESTAURANT -> CONFIRMED_BY_STUDENT` or escalate.
- Auto-disable trigger for restaurants is implemented via repeated report patterns.

## 5. File-by-file map (human-readable)

Notes:
- This map focuses on project files (not generated dependency/build files).
- Generated/runtime directories (`node_modules`, `.next`, `backend/dist`) are intentionally not detailed.

### Root files
- `.dockerignore`: Docker build ignore rules.
- `.env.local`: Frontend env with `NEXT_PUBLIC_API_URL=http://localhost:4000`.
- `.eslintrc.json`: Next.js lint preset.
- `.gitignore`: Root ignore rules.
- `dockerfile`: Node 18 Alpine dev-style container setup.
- `FILES_CHECKLIST.md`: Legacy checklist; partially outdated.
- `MANUAL_ACTIONS.md`: Setup notes; mixed old/new reality.
- `next-env.d.ts`: Next.js TypeScript type stub.
- `next.config.js`: React strict mode + polling watch options.
- `package-project.ps1`: Zip packaging script.
- `package.json`: Frontend dependencies/scripts.
- `package-lock.json`: Frontend dependency lockfile.
- `PROJECT_STRUCTURE.md`: Structure documentation; not fully synced.
- `PROMPT_LOG.md`: Historical implementation log across prompts.
- `README.md`: Legacy root README (frontend-first wording, partially outdated).
- `tsconfig.json`: Frontend TypeScript config.
- `tsconfig.tsbuildinfo`: TypeScript incremental cache artifact.
- `CURRENT_STATE_SNAPSHOT.md`: This status snapshot file.

### `app/` routes and UI files
- `app/layout.tsx`: Root layout + global metadata + icon setup.
- `app/globals.css`: Global reset/base styles.
- `app/loading.tsx`: Global suspense loading overlay with brand icon.
- `app/loading.module.css`: Loading overlay/progress/animation styling.
- `app/page.tsx`: University selection screen (fetches active universities).
- `app/page.module.css`: University selection styling.
- `app/about/page.tsx`: Auth-protected About page.
- `app/about/about.module.css`: About page styling.
- `app/auth/login/page.tsx`: Login form with university context and role redirects.
- `app/auth/login/auth.module.css`: Shared auth page styling.
- `app/auth/signup/page.tsx`: Student signup + immediate login.
- `app/auth/forgot-password/page.tsx`: UI-only forgot password flow.
- `app/auth/verify/page.tsx`: UI-only account verification UX.
- `app/maintenance/page.tsx`: Maintenance-mode page using global config.
- `app/student/layout.tsx`: Student auth/layout guard + active-order/pending banners.
- `app/student/layout.module.css`: Student layout banners and quick actions.
- `app/student/home/page.tsx`: Student home with restaurants and availability handling.
- `app/student/home/home.module.css`: Student home styling.
- `app/student/restaurant/[id]/page.tsx`: Restaurant menu, cart add flow, reporting modal.
- `app/student/restaurant/[id]/menu.module.css`: Menu page and modal styling.
- `app/student/cart/page.tsx`: Cart, payment selection, card validation, order creation.
- `app/student/cart/cart.module.css`: Cart/payment styling.
- `app/student/order/[id]/page.tsx`: Student single-order status tracking and completion.
- `app/student/order/[id]/order.module.css`: Student order detail styling.
- `app/student/orders/page.tsx`: Student orders history + reports tabs.
- `app/student/orders/orders.module.css`: Student orders/reports styling.
- `app/restaurant/layout.tsx`: Restaurant-admin auth/layout guard.
- `app/restaurant/dashboard/page.tsx`: Restaurant dashboard tabs (orders/menu/reports/settings).
- `app/restaurant/dashboard/dashboard.module.css`: Restaurant dashboard styling.
- `app/admin/layout.tsx`: Super-admin auth/layout guard.
- `app/admin/dashboard/page.tsx`: Super-admin dashboard sections and controls.
- `app/admin/dashboard/admin.module.css`: Super-admin dashboard styling.
- `app/orders/layout.tsx`: Layout guard for shared order-detail route (restaurant/super admin).
- `app/orders/[id]/page.tsx`: Unified order details page for internal roles.
- `app/orders/[id]/page.module.css`: Unified order detail styling.
- `app/profile/page.tsx`: Auth-protected profile page (role-aware fields/analytics).
- `app/profile/profile.module.css`: Profile styling.
- `app/settings/page.tsx`: Settings page with language preferences and shortcuts.
- `app/settings/settings.module.css`: Settings styling.
- `app/settings/change-password/page.tsx`: Change password flow.
- `app/settings/change-password/change-password.module.css`: Change-password styling.

### `components/`
- `components/LanguageProvider.tsx`: Global locale/message context.
- `components/ProtectedRolePage.tsx`: Auth gate wrapper for protected generic pages.
- `components/RoleShell.tsx`: Shared shell wrapper (sidebar + main content).
- `components/RoleSidebar.tsx`: Role-aware sidebar navigation with attention badges.
- `components/role-shell.module.css`: RoleShell layout styles.
- `components/role-sidebar.module.css`: Sidebar styles and collapsed behavior.
- `components/RestaurantOrdersView.tsx`: Restaurant orders queue UI/logic with filters and actions.
- `components/AdminMonthlyOrdersPanel.tsx`: Super-admin monthly orders panel with paging/filters.

### `lib/`
- `lib/api.ts`: Main frontend API client/types across auth, university, restaurant, menu, orders, reports, config.
- `lib/auth.ts`: Session check + role helper utilities.
- `lib/i18n.ts`: Dictionary resolution/translation helpers.
- `lib/language.ts`: Applies language and text direction to `document`.
- `lib/profile-api.ts`: Profile-focused API wrappers.
- `lib/mockData.ts`: Legacy mock data structures (now mostly historical fallback).

### `locales/`
- `locales/en.json`: English translation dictionary.
- `locales/ar.json`: Arabic translation dictionary.

### `public/`
- `public/logo-full.svg`: Main UniBite full logo asset.
- `public/logo-icon.svg`: Icon mark used in sidebar/loading/placeholders.
- `public/favicon-16x16.png`: 16x16 favicon.
- `public/favicon-32x32.png`: 32x32 favicon.
- `public/apple-touch-icon.png`: Apple touch icon.

### `backend/` root
- `backend/.env`: Backend env (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`).
- `backend/.gitignore`: Backend-specific ignore config.
- `backend/.prettierrc`: Backend Prettier config.
- `backend/docker-compose.yml`: Postgres container config.
- `backend/eslint.config.mjs`: Backend ESLint config.
- `backend/nest-cli.json`: Nest build settings.
- `backend/package.json`: Backend scripts/dependencies.
- `backend/package-lock.json`: Backend lockfile.
- `backend/README.md`: Backend docs (partially outdated ports/details).
- `backend/tsconfig.json`: Backend TS config.
- `backend/tsconfig.build.json`: Backend build TS exclusions.
- `backend/migration_output.txt`: Stored Prisma error output.
- `backend/migration_output_2.txt`: Stored Prisma migration output.
- `backend/test_output.txt`: Stored e2e failure log.
- `backend/test_output_2.txt`: Stored e2e failure log.
- `backend/prismaschema.prisma60`: Zero-byte anomalous tracked file.

### `backend/prisma/`
- `backend/prisma/schema.prisma`: Current canonical Prisma schema.
- `backend/prisma/migrations/migration_lock.toml`: Prisma migration lock metadata.
- `backend/prisma/migrations/20260202021453_init_auth/migration.sql`: Initial users/roles setup.
- `backend/prisma/migrations/20260203032855_add_university_model/migration.sql`: University model + links.
- `backend/prisma/migrations/20260206082350_add_menu_models/migration.sql`: Restaurant/category/product/extras models.
- `backend/prisma/migrations/20260210135042_add_restaurant_open_close_state/migration.sql`: Restaurant open/close fields.
- `backend/prisma/migrations/20260213130718_add_max_concurrent_orders/migration.sql`: Concurrency limit field.
- `backend/prisma/migrations/20260213131519_add_orders/migration.sql`: Initial orders/order_items/payment method enum.
- `backend/prisma/migrations/20260213142708_add_global_config/migration.sql`: Global config table.
- `backend/prisma/migrations/20260213150730_add_report_system/migration.sql`: Reports + statuses + restaurant disable flag.
- `backend/prisma/migrations/20260213155226_add_disabled_at_to_restaurant/migration.sql`: `disabledAt` timestamp.
- `backend/prisma/migrations/20260217141000_add_order_cancellation_and_refund_fields/migration.sql`: order number + cancellation/refund fields.
- `backend/prisma/migrations/20260217152000_payment_method_backend_foundation/migration.sql`: Payment enum migration to `CARD`/`COUNTER`, `cardLast4`.
- `backend/prisma/migrations/20260217170000_add_pos_order_number/migration.sql`: POS reference field.
- `backend/prisma/migrations/20260218120000_order_state_machine_controlled_cancellation/migration.sql`: status rename + completed + timeout reason + timestamps.
- `backend/prisma/migrations/20260219190000_add_user_profile_fields/migration.sql`: user `name`/`phone`/`language`.
- `backend/prisma/migrations/20260222043000_add_payment_status_decoupling/migration.sql`: adds `PaymentStatus` enum and `orders.paymentStatus` column (`NOT NULL DEFAULT 'PENDING'`).

### `backend/src/`

#### App core
- `backend/src/main.ts`: Nest bootstrap, CORS, cookie parser, validation pipe.
- `backend/src/app.module.ts`: Root module imports all domain modules.
- `backend/src/app.controller.ts`: Root health-ish `GET /` endpoint.
- `backend/src/app.service.ts`: Returns hello string.
- `backend/src/app.controller.spec.ts`: Basic app controller unit test.

#### Prisma support
- `backend/src/prisma/prisma.module.ts`: Global Prisma module.
- `backend/src/prisma/prisma.service.ts`: Prisma client lifecycle hooks.

#### Auth
- `backend/src/auth/auth.module.ts`: Auth module wiring with JWT.
- `backend/src/auth/auth.controller.ts`: Signup/login/logout/me/change-password endpoints.
- `backend/src/auth/auth.service.ts`: Core auth rules, role/university checks, password change.
- `backend/src/auth/strategies/jwt.strategy.ts`: Cookie JWT extraction strategy.
- `backend/src/auth/dto/login.dto.ts`: Login request validation.
- `backend/src/auth/dto/signup.dto.ts`: Signup request validation.
- `backend/src/auth/dto/change-password.dto.ts`: Change-password validation.

#### Common authz utilities
- `backend/src/common/decorators/roles.decorator.ts`: `@Roles()` decorator.
- `backend/src/common/guards/jwt-auth.guard.ts`: Passport JWT guard.
- `backend/src/common/guards/roles.guard.ts`: Role-based guard.
- `backend/src/common/guards/restaurant-owner.guard.ts`: Restaurant ownership guard logic.

#### Users
- `backend/src/users/users.module.ts`: Users module.
- `backend/src/users/users.controller.ts`: Profile/language endpoints.
- `backend/src/users/users.service.ts`: User creation, profile update, analytics shaping.
- `backend/src/users/dto/create-user.dto.ts`: Create-user validation.
- `backend/src/users/dto/update-profile.dto.ts`: Profile update validation.
- `backend/src/users/dto/update-language.dto.ts`: Language update validation.

#### University
- `backend/src/university/university.module.ts`: University module.
- `backend/src/university/university.controller.ts`: University endpoints + role guards.
- `backend/src/university/university.service.ts`: University CRUD + stats.
- `backend/src/university/dto/create-university.dto.ts`: Validation for create.
- `backend/src/university/dto/update-university.dto.ts`: Validation for update.

#### Restaurant
- `backend/src/restaurant/restaurant.module.ts`: Restaurant module wiring.
- `backend/src/restaurant/restaurant.controller.ts`: Restaurant endpoints for public/admin/super-admin.
- `backend/src/restaurant/restaurant.service.ts`: Restaurant creation/settings/public visibility/auto-close/auto-disable insights/re-enable.
- `backend/src/restaurant/restaurant.service.spec.ts`: Unit tests for public availability/busy logic.
- `backend/src/restaurant/dto/create-restaurant.dto.ts`: Create restaurant + admin validation.
- `backend/src/restaurant/dto/update-restaurant-settings.dto.ts`: Settings update validation.

#### Menu
- `backend/src/menu/menu.module.ts`: Menu module.
- `backend/src/menu/menu.controller.ts`: Category/product and public menu endpoints.
- `backend/src/menu/menu.service.ts`: Menu CRUD + stock-aware public projection.
- `backend/src/menu/dto/create-category.dto.ts`: Category create validation.
- `backend/src/menu/dto/update-category.dto.ts`: Category update validation.
- `backend/src/menu/dto/create-product.dto.ts`: Product create validation.
- `backend/src/menu/dto/update-product.dto.ts`: Product update validation.

#### Order
- `backend/src/order/order.module.ts`: Order module.
- `backend/src/order/order.controller.ts`: Student/restaurant/admin order endpoints + query parsing.
- `backend/src/order/order.service.ts`: Order creation, status machine, cancellation, pagination, analytics, timeout auto-cancel, and payment status integration on completion.
- `backend/src/order/dto/create-order.dto.ts`: Order + card data validation.
- `backend/src/order/dto/update-order-status.dto.ts`: Status update validation.
- `backend/src/order/dto/cancel-order-by-restaurant.dto.ts`: Restaurant cancel validation.
- `backend/src/order/dto/update-order-pos.dto.ts`: POS reference validation.

#### Config
- `backend/src/config/config.module.ts`: Config module.
- `backend/src/config/config.controller.ts`: Public get + super-admin update.
- `backend/src/config/config.service.ts`: Singleton global config read/update.
- `backend/src/config/dto/update-config.dto.ts`: Config update validation.

#### Report
- `backend/src/report/report.module.ts`: Report module.
- `backend/src/report/report.controller.ts`: Report creation/resolve/confirm/list/count/escalated endpoints.
- `backend/src/report/report.service.ts`: Report workflow, anti-spam, auto-escalation scheduler, auto-disable trigger.
- `backend/src/report/dto/create-report.dto.ts`: Report create validation.

### `backend/test/`
- `backend/test/app.e2e-spec.ts`: Basic root endpoint e2e test.
- `backend/test/phase5.e2e-spec.ts`: Service-fee-focused e2e test draft (currently problematic).
- `backend/test/jest-e2e.json`: E2E Jest config.

## 6. Current test/build evidence in workspace

Based on checked files (not rerunning full suite in this audit):
- Stored test output shows e2e failures in `phase5.e2e-spec.ts`.
- Failure examples include:
  - invalid Prisma `upsert` unique usage
  - `request is not a function` in test setup
- Stored migration output shows at least one older schema validation issue followed by a successful migration run.

## 7. Phase 2 – Payment Status Decoupling (Completed)

- Scope: backend only, no frontend behavior changes.
- Schema changes:
  - Added enum `PaymentStatus` with values: `PENDING`, `PAID`, `FAILED`, `REFUNDED`.
  - Added `Order.paymentStatus PaymentStatus @default(PENDING)`.
- Migration:
  - `20260222043000_add_payment_status_decoupling`
  - SQL adds enum + new `orders.paymentStatus` column with default `PENDING`.
  - Existing rows are preserved and initialized safely via default.
- Backend logic changes:
  - Order creation explicitly persists `paymentStatus: PENDING` for both `CARD` and `COUNTER`.
  - On status transition to `COMPLETED`, if `paymentMethod === COUNTER`, `paymentStatus` is set to `PAID` in the same update operation.
  - `CARD` flow remains unchanged (stays `PENDING` unless future payment flow updates it).
- Files modified in this phase:
  - `backend/prisma/schema.prisma`
  - `backend/prisma/migrations/20260222043000_add_payment_status_decoupling/migration.sql`
  - `backend/src/order/order.service.ts`
  - `backend/test/app.e2e-spec.ts` (TypeScript import compatibility)
  - `backend/test/phase5.e2e-spec.ts` (TypeScript import compatibility)
  - `CURRENT_STATE_SNAPSHOT.md`

## 8. Practical next cleanup priorities

If your goal is a clean, production-ready baseline, the highest-value next steps are:
- Align ports and CORS (`frontend dev port` vs backend `allowed origins`).
- Update stale documentation (`README.md`, `MANUAL_ACTIONS.md`, `PROJECT_STRUCTURE.md`) to match current code.
- Remove or fix anomalous tracked file `backend/prismaschema.prisma60`.
- Decide whether deleted PWA files should stay deleted or be restored with current metadata strategy.
- Stabilize tests (`backend/test/phase5.e2e-spec.ts`) and remove obsolete output artifacts if no longer needed.
- Review untracked files and intentionally add/ignore them to reduce repository ambiguity.

## 9. Phase 3 - Service Fee Accounting Integrity (Completed)

- Scope: backend-only changes.
- Prisma schema:
  - Added `Order.serviceFeeCollected Boolean @default(false)` adjacent to `serviceFee`.
- Migration:
  - Name: `20260222110000_add_service_fee_collected`
  - File: `backend/prisma/migrations/20260222110000_add_service_fee_collected/migration.sql`
  - SQL behavior: `ALTER TABLE "orders" ADD COLUMN "serviceFeeCollected" BOOLEAN NOT NULL DEFAULT false;`
  - Safety: non-destructive; no table drops/recreates; existing rows default to `false`.

- New endpoints (SUPER_ADMIN only, JWT + Roles guard protected):
  - `GET /admin/service-fee/outstanding`
  - `POST /admin/service-fee/collect` with body `{ "restaurantId": "string" }`

- Aggregation and settlement rules implemented:
  - Qualifying orders are only:
    - `paymentMethod = COUNTER`
    - `status = COMPLETED`
    - `serviceFeeCollected = false`
    - `serviceFee > 0`
  - Refunded orders are excluded (`paymentStatus != REFUNDED` and `refundStatus != REFUNDED`).
  - Outstanding total uses stored historical `SUM(order.serviceFee)` (no recomputation from config).
  - Settlement runs in a single Prisma transaction and flips qualifying orders to `serviceFeeCollected = true`.
  - Once collected, orders are excluded from future outstanding queries (prevents re-inclusion/double billing).

- Service fee integrity confirmations:
  - Service fee is not recalculated in outstanding/settlement paths.
  - Existing order creation logic remains unchanged and still snapshots `serviceFee` from `GlobalConfig` at order time.
  - `GlobalConfig.serviceFeeEnabled` and `GlobalConfig.serviceFeeAmount` remain respected for creation/config, but are not used for historical outstanding computation.
  - Phase 2 payment lifecycle logic remains intact (including `paymentStatus` behavior).

- Verification performed:
  - `npx prisma migrate deploy` (migration applied)
  - `npx prisma generate` (success)
  - `npx prisma validate` (success)
  - `npm run build` in `backend/` (success)

- Files created:
  - `backend/src/order/admin-service-fee.controller.ts`
  - `backend/src/order/dto/collect-service-fee.dto.ts`
  - `backend/prisma/migrations/20260222110000_add_service_fee_collected/migration.sql`

- Files modified:
  - `backend/prisma/schema.prisma`
  - `backend/src/order/order.module.ts`
  - `backend/src/order/order.service.ts`
  - `CURRENT_STATE_SNAPSHOT.md`

## 10. Phase 4 - Security Hardening (Completed)

- Scope:
  - Backend-only security hardening.
  - No schema changes.
  - No business-logic changes to order lifecycle, service-fee calculation, or payment status behavior.
  - No API response shape changes.

- Rate limiting added (`@nestjs/throttler`):
  - Global throttler guard configured with permissive default (`120` requests / `60s`) to avoid heavy impact on normal traffic.
  - Targeted endpoint limits:
    - `POST /auth/login`: `5` / `60s`
    - `POST /auth/signup`: `5` / `60s`
    - `POST /order` (order creation): `10` / `60s`
    - `POST /report` and `POST /reports` (same handler): `10` / `60s`
    - `POST /admin/service-fee/collect`: `5` / `60s`
    - Order status/cancellation update handlers:
      - `PATCH /order/:id/status`: `20` / `60s`
      - `POST /order/:id/cancel`: `20` / `60s`

- Pagination hard caps enforced:
  - Controller-level validation now enforces:
    - `page >= 1`
    - `pageSize >= 1`
    - `pageSize <= 50` (rejects larger values with `400`)
  - Existing service-side clamp to max 50 remains in place as defense-in-depth.

- Ownership re-validation audit:
  - Guards audited: `JwtAuthGuard`, `RolesGuard`, `RestaurantOwnerGuard`.
  - `GET /order/restaurant/:restaurantId` now explicitly uses `RestaurantOwnerGuard` in addition to existing role checks.
  - Restaurant-admin ownership for order status updates remains enforced in `OrderService.updateStatus` by checking order.restaurantId against the authenticated user’s restaurant.
  - Menu edit endpoints remain protected by `JwtAuthGuard + RolesGuard + RestaurantOwnerGuard` and use `req.restaurantId` (not client-provided ids).
  - Report restaurant-admin actions continue to derive restaurant context from authenticated user and service-side ownership checks.

- SUPER_ADMIN financial endpoint protection verified:
  - `GET /admin/service-fee/outstanding` and `POST /admin/service-fee/collect` are protected by:
    - `JwtAuthGuard`
    - `RolesGuard`
    - `@Roles(Role.SUPER_ADMIN)`
  - `POST /admin/service-fee/collect` now also has a strict rate limit.

- JWT cookie hardening:
  - Login cookie remains `httpOnly`.
  - `secure` is now environment-aware: `true` when `NODE_ENV === 'production'`, otherwise `false`.
  - `sameSite: 'lax'` retained.
  - Logout cookie clearing now uses matching security attributes (`httpOnly`, `secure`, `sameSite`, `path`) for reliable invalidation.

- Input validation hardening:
  - `CollectServiceFeeDto`:
    - trims input
    - requires non-empty UUID `restaurantId`
  - `CreateOrderDto`:
    - `restaurantId` + `productId` UUID validation
    - `items` array min/max bounds
    - quantity integer with bounds
    - per-item comment length limit
    - extras arrays (`sauces`, `addOns`) UUID + max size limits
    - card holder name max length
  - `UpdateOrderStatusDto`:
    - `status` must be non-empty enum value
  - `CancelOrderByRestaurantDto`:
    - trims `comment`
    - enforces max comment length when provided/required
  - `UpdateConfigDto`:
    - `serviceFeeAmount` now constrained with finite numeric validation, decimal precision cap, and upper bound to prevent extreme values.

- Defensive programming audit:
  - No raw SQL introduced.
  - Prisma filters remain explicit, controlled `where` clauses.
  - No dynamic field injection paths added.

- Verification performed:
  - `npm run build` in `backend/` (success)
  - `npx prisma validate` in `backend/` (success)

- New files created:
  - None

- Files modified:
  - `backend/package.json`
  - `backend/package-lock.json`
  - `backend/src/app.module.ts`
  - `backend/src/auth/auth.controller.ts`
  - `backend/src/order/admin-service-fee.controller.ts`
  - `backend/src/order/order.controller.ts`
  - `backend/src/report/report.controller.ts`
  - `backend/src/order/dto/collect-service-fee.dto.ts`
  - `backend/src/order/dto/create-order.dto.ts`
  - `backend/src/order/dto/update-order-status.dto.ts`
  - `backend/src/order/dto/cancel-order-by-restaurant.dto.ts`
  - `backend/src/config/dto/update-config.dto.ts`
  - `CURRENT_STATE_SNAPSHOT.md`

- Dependencies added:
  - `@nestjs/throttler` (`^6.5.0`)

## 11. Phase 5 - Real-Time Infrastructure & Notification System (Completed)

- Scope:
  - Full-stack targeted implementation for realtime + in-app notifications.
  - No financial logic changes (`serviceFee`, settlement, paymentStatus unchanged).
  - No business flow redesign for orders/reports.
  - No HTTPS push implementation in this phase.

- Prisma additions:
  - New enum: `NotificationType`
    - `ORDER_READY`
    - `ORDER_CANCELLED`
    - `REPORT_RESOLVED`
    - `ESCALATION_CREATED`
    - `ESCALATION_RESOLVED`
  - New model: `Notification` (DB-backed user notifications).
  - User relation backfield added: `User.notifications`.
  - Migration applied: `20260222123000_add_notifications`.

- Backend notification system:
  - Added notification module/service/controller:
    - create notification
    - fetch current-user notifications
    - mark notification as read (ownership enforced)
    - unread count endpoint
  - Endpoints protected with `JwtAuthGuard`:
    - `GET /notifications`
    - `GET /notifications/unread-count`
    - `PATCH /notifications/:id/read`

- Business-event notification hooks (without changing core state decisions):
  - Order status becomes `READY` -> student notification (`ORDER_READY`).
  - Order status becomes `CANCELLED` -> student notification (`ORDER_CANCELLED`).
  - Report resolved by restaurant -> student notification (`REPORT_RESOLVED`).
  - Escalation created (3-strike and stale auto-escalation paths) -> super admin notifications (`ESCALATION_CREATED`).

- Realtime WebSocket infrastructure:
  - Added Socket.IO gateway with JWT cookie authentication on connection.
  - Room assignment on connect:
    - `RESTAURANT_ADMIN` -> `restaurant:{restaurantId}`
    - `STUDENT` -> `student:{userId}`
    - `SUPER_ADMIN` -> `super-admin`
  - Cross-room listening is not exposed (server-controlled room joins only).
  - Emitted events:
    - New order -> `order:new` to `restaurant:{restaurantId}`
    - Order status change -> `order:statusChanged` to both restaurant and student rooms
    - Notification creation -> `notification:new` to student room or super-admin room as applicable
  - No global broadcast usage for these domain events.

- Frontend minimal integration:
  - Added page-scoped socket connections only:
    - Restaurant dashboard page
    - Student order detail page
  - No global app-wide socket connection introduced.
  - Added reusable notification badge/dropdown component with realtime updates.
  - Added `/notifications` page for full notification list and mark-as-read.

- HTTPS-dependent push status:
  - Not implemented by design in this phase:
    - Service Worker
    - Web Push API
    - VAPID keys
    - Firebase messaging
    - Browser push permission flow
    - Background push delivery
  - Added root planning doc: `FUTURE_PLAN.md`.

- Verification performed:
  - `npx prisma migrate deploy` (success)
  - `npx prisma generate` (success)
  - `npx prisma validate` (success)
  - `npm run build` in `backend/` (success)
  - `npm run build` in project root (frontend) (success)

- Files created:
  - `backend/prisma/migrations/20260222123000_add_notifications/migration.sql`
  - `backend/src/notification/notification.module.ts`
  - `backend/src/notification/notification.service.ts`
  - `backend/src/notification/notification.controller.ts`
  - `backend/src/realtime/realtime.gateway.ts`
  - `backend/src/realtime/realtime.module.ts`
  - `lib/realtime.ts`
  - `components/NotificationBell.tsx`
  - `components/notification-bell.module.css`
  - `app/notifications/page.tsx`
  - `app/notifications/notifications.module.css`
  - `FUTURE_PLAN.md`

- Files modified:
  - `backend/prisma/schema.prisma`
  - `backend/src/app.module.ts`
  - `backend/src/order/order.module.ts`
  - `backend/src/order/order.service.ts`
  - `backend/src/report/report.module.ts`
  - `backend/src/report/report.service.ts`
  - `backend/package.json`
  - `backend/package-lock.json`
  - `lib/api.ts`
  - `components/RestaurantOrdersView.tsx`
  - `app/restaurant/dashboard/page.tsx`
  - `app/student/order/[id]/page.tsx`
  - `app/student/order/[id]/order.module.css`
  - `package.json`
  - `package-lock.json`
  - `CURRENT_STATE_SNAPSHOT.md`

## 12. Phase 6A - Email Verification (Completed)

- Scope:
  - Isolated email verification feature only.
  - No forgot password, no Google OAuth, no SMS.
  - Financial logic and payment/service-fee flows unchanged.

- Prisma schema changes:
  - Added to `User` model:
    - `verificationCode String?`
    - `verificationCodeExpiresAt DateTime?`
    - `verificationResendCount Int @default(0)`
    - `verificationResendWindow DateTime?`

- Migration:
  - Name: `20260222133000_add_email_verification_fields`
  - File: `backend/prisma/migrations/20260222133000_add_email_verification_fields/migration.sql`
  - SQL behavior: adds the four verification columns on `users` with `verificationResendCount` defaulting to `0`.

- Backend email integration:
  - Added `resend` dependency in backend.
  - Added `EmailModule` and `EmailService`.
  - `EmailService.sendVerificationCode(email, code)` sends via Resend with:
    - from: `onboarding@resend.dev`
    - subject: `Verify your UniBite account`
    - text body containing the 6-digit code and 10-minute expiry note.

- Auth flow updates:
  - Signup now:
    - keeps university domain validation.
    - creates student user.
    - generates and stores a 6-digit verification code.
    - sets code expiry to 10 minutes.
    - initializes resend window/counter.
    - sends verification email.
    - returns error if email dispatch fails.
  - Added `POST /auth/verify-email`:
    - validates email + code match and expiry.
    - sets `isVerified = true` and clears verification fields on success.
  - Added `POST /auth/resend-verification`:
    - rejects already verified users.
    - enforces max `5` resend attempts per hour.
    - resets resend window/counter after one hour.
    - generates a fresh 6-digit code and 10-minute expiry.
    - protected with route throttle (`5` per hour).
  - Login behavior unchanged for verification state (unverified users can still log in).

- Ordering block rule:
  - `OrderService.create(...)` now checks authenticated student verification status.
  - If `isVerified` is false, it throws `ForbiddenException('Email not verified')` before order creation.
  - No other order business logic was changed.

- Frontend flow updates:
  - Signup redirects to `/auth/verify?email=...` after successful registration.
  - Added functional `/auth/verify` page behavior:
    - 6-digit code entry.
    - verify submit to `/auth/verify-email`.
    - resend action to `/auth/resend-verification`.
    - success state with redirect to login.
  - Student home now shows unverified banner after login:
    - message: `Please verify your email before placing orders.`
    - includes `Resend Code` action.

- Verification and build checks:
  - `npx prisma validate` in `backend/` (success)
  - `npx prisma generate` in `backend/` (success)
  - `npm run build` in `backend/` (success)
  - `npm run build` in project root (frontend) (success)
  - `npx prisma migrate dev --skip-generate` currently fails in this environment with Prisma schema engine error while targeting local PostgreSQL (`localhost:5432`).

- Files created:
  - `backend/src/email/email.module.ts`
  - `backend/src/email/email.service.ts`
  - `backend/src/auth/dto/verify-email.dto.ts`
  - `backend/src/auth/dto/resend-verification.dto.ts`
  - `backend/prisma/migrations/20260222133000_add_email_verification_fields/migration.sql`

- Files modified:
  - `backend/prisma/schema.prisma`
  - `backend/src/auth/auth.module.ts`
  - `backend/src/auth/auth.controller.ts`
  - `backend/src/auth/auth.service.ts`
  - `backend/src/order/order.service.ts`
  - `backend/package.json`
  - `backend/package-lock.json`
  - `lib/api.ts`
  - `app/auth/signup/page.tsx`
  - `app/auth/verify/page.tsx`
  - `app/student/home/page.tsx`
  - `app/student/home/home.module.css`
  - `CURRENT_STATE_SNAPSHOT.md`

## 13. Phase 6B - Secure Forgot Password (Completed)

- Scope:
  - Implemented secure link-based forgot-password flow.
  - Isolated from email verification flow (Phase 6A remains unchanged).
  - No changes to financial, order, payment, role, or websocket logic.

- Prisma schema changes:
  - Added to `User` model:
    - `passwordResetToken String?`
    - `passwordResetExpiresAt DateTime?`

- Migration:
  - Name: `20260223100000_add_password_reset_fields`
  - File: `backend/prisma/migrations/20260223100000_add_password_reset_fields/migration.sql`
  - SQL behavior: adds nullable reset token and expiry columns to `users`.

- Token security model:
  - Forgot-password creates cryptographically secure token via `crypto.randomBytes(32).toString('hex')`.
  - Raw token is never stored in DB.
  - DB stores SHA-256 hash only.
  - Reset endpoint hashes incoming token and matches against stored hash.
  - Expiry enforced at 15 minutes.
  - Token is single-use: cleared after successful password reset.

- Backend endpoints added:
  - `POST /auth/forgot-password`
    - DTO: email only.
    - Rate limited (`5` requests/hour).
    - Returns same generic success message for existing and non-existing emails (no user enumeration).
    - For existing users, stores hashed token + expiry and sends reset email link.
  - `POST /auth/reset-password`
    - DTO: token + new password.
    - Rejects invalid/expired token.
    - Hashes new password with existing bcrypt approach.
    - Clears `passwordResetToken` and `passwordResetExpiresAt` after success.

- Email integration:
  - Added `EmailService.sendPasswordReset(email, resetLink)`.
  - Uses Resend sender `onboarding@resend.dev`.
  - Subject: `Reset your UniBite password`.
  - Body includes reset link and 15-minute expiry note.
  - Reset link format defaults to:
    - `http://localhost:3001/auth/reset-password?token=<rawToken>`
    - Base URL can be overridden by `FRONTEND_URL`.

- Frontend updates:
  - Updated `app/auth/forgot-password/page.tsx` to call backend forgot-password endpoint.
  - Added `app/auth/reset-password/page.tsx`:
    - Reads token from query string.
    - Collects new password + confirmation.
    - Calls backend reset-password endpoint.
    - Shows success state and redirects to login.
  - Added API helpers in `lib/api.ts`:
    - `forgotPassword(email)`
    - `resetPassword(token, newPassword)`

- Verification and build checks:
  - `npx prisma validate` in `backend/` (success)
  - `npx prisma generate` in `backend/` (success)
  - `npm run build` in `backend/` (success)
  - `npm run build` in project root (frontend) (success)
  - `npx prisma migrate dev --name add_password_reset_fields` currently fails in this environment with Prisma schema engine error while targeting local PostgreSQL (`localhost:5432`).

- Files created:
  - `backend/src/auth/dto/forgot-password.dto.ts`
  - `backend/src/auth/dto/reset-password.dto.ts`
  - `backend/prisma/migrations/20260223100000_add_password_reset_fields/migration.sql`
  - `app/auth/reset-password/page.tsx`

- Files modified:
  - `backend/prisma/schema.prisma`
  - `backend/src/auth/auth.controller.ts`
  - `backend/src/auth/auth.service.ts`
  - `backend/src/email/email.service.ts`
  - `lib/api.ts`
  - `app/auth/forgot-password/page.tsx`
  - `CURRENT_STATE_SNAPSHOT.md`

## 14. Phase 6C - Google OAuth (Completed)

- Scope:
  - Added backend-handled Google OAuth login flow.
  - Kept existing email/password login, email verification, and forgot-password flows intact.
  - No schema changes.
  - No changes to financial/order/payment/websocket logic.

- Dependencies added (backend):
  - `passport-google-oauth20`
  - `@types/passport-google-oauth20` (dev dependency)

- Backend strategy added:
  - File: `backend/src/auth/strategies/google.strategy.ts`
  - Uses Passport Google strategy with env configuration:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - callback default: `http://localhost:4000/auth/google/callback`
  - Validation behavior:
    - Extracts email from Google profile.
    - Rejects when no usable email.
    - Resolves domain and matches it against active `University.allowedEmailDomains`.
    - Rejects when no university domain match.
    - If user exists: returns existing account (and auto-verifies if needed).
    - If user does not exist: auto-creates `STUDENT` only, assigns matched `universityId`, sets `isVerified = true`, stores hashed random password.

- Backend module/controller updates:
  - `AuthModule` registers `GoogleStrategy` provider.
  - Added routes in `AuthController`:
    - `GET /auth/google` (starts OAuth via `AuthGuard('google')`)
    - `GET /auth/google/callback` (OAuth callback via `AuthGuard('google')`)
  - Callback behavior:
    - Signs JWT with same payload structure as normal login.
    - Sets `access_token` cookie using same config as normal login (`httpOnly`, `sameSite: 'lax'`, `secure` only in production, 24h maxAge).
    - Redirects to `FRONTEND_URL` or `http://localhost:3001`.

- Frontend updates:
  - Wired Google button on auth pages to backend OAuth start URL (`{API_BASE_URL}/auth/google`):
    - `app/auth/login/page.tsx`
    - `app/auth/signup/page.tsx`
  - Added inline Google icon and enabled interactive button style in:
    - `app/auth/login/auth.module.css`

- Security/behavior confirmations:
  - Google login enforces university domain restriction from backend.
  - Auto-create path is restricted to `STUDENT` role only.
  - Existing users are not recreated.
  - No token handling is done in frontend; session cookie remains backend-controlled.

- Verification and build checks:
  - `npx prisma validate` in `backend/` (success)
  - `npx prisma generate` in `backend/` (success)
  - `npm run build` in `backend/` (success)
  - `npm run build` in project root (frontend) (success)

- Files created:
  - `backend/src/auth/strategies/google.strategy.ts`

- Files modified:
  - `backend/src/auth/auth.module.ts`
  - `backend/src/auth/auth.controller.ts`
  - `backend/package.json`
  - `backend/package-lock.json`
  - `app/auth/login/page.tsx`
  - `app/auth/signup/page.tsx`
  - `app/auth/login/auth.module.css`
  - `CURRENT_STATE_SNAPSHOT.md`

## 15. UI Enhancement - Favicon Optimization (Completed)

- Scope:
  - Improved favicon sharpness and tab/bookmark rendering consistency.
  - Frontend-only UI asset/meta update; no business logic changes.
  - No backend/auth/order/payment logic changes.

- SVG optimized:
  - Updated `public/logo-icon.svg` viewBox from `0 0 2200 1238` to `0 0 1024 1024`.
  - Removed effective internal padding caused by oversized viewBox so icon content fills the square as intended.

- Multi-size favicon set added/regenerated in `public/`:
  - `favicon-16x16.png`
  - `favicon-32x32.png`
  - `favicon-48x48.png`
  - `favicon-192x192.png`
  - `favicon-512x512.png`
  - `apple-touch-icon.png` (`180x180`)

- Metadata updated:
  - `app/layout.tsx` now uses PNG favicon entries:
    - `/favicon-16x16.png`
    - `/favicon-32x32.png`
    - `/favicon-48x48.png`
  - Apple icon set to `/apple-touch-icon.png`.
  - Removed `/logo-icon.svg` as primary favicon metadata source.

- Preload cleanup:
  - No explicit preload link for `/logo-icon.svg` exists in current layout/source, so no preload removal patch was required.

- Verification:
  - `npm run build` (frontend root) completed successfully.
  - No preload warning appeared during build.
  - No build-time errors introduced.

- Files modified:
  - `public/logo-icon.svg`
  - `public/favicon-16x16.png`
  - `public/favicon-32x32.png`
  - `public/favicon-48x48.png`
  - `public/favicon-192x192.png`
  - `public/favicon-512x512.png`
  - `public/apple-touch-icon.png`
  - `app/layout.tsx`
  - `CURRENT_STATE_SNAPSHOT.md`

## 16. Stability & UX Fix Pass - Post Phase 6 Hard Test (Completed)

- Scope:
  - Applied targeted stability and UX fixes across frontend and backend.
  - Kept business-critical financial/service-fee/payment lifecycle behavior unchanged.
  - No migration files modified.

- Bugs resolved:
  - Google OAuth redirect routing:
    - Backend OAuth callback now redirects to `/auth/oauth-success` instead of root.
    - Added frontend OAuth success page that calls `/auth/me` and redirects by role:
      - `STUDENT` -> `/student/home`
      - `RESTAURANT_ADMIN` -> `/restaurant/dashboard`
      - `SUPER_ADMIN` -> `/admin/dashboard`
  - Escalated reports visibility for super admin:
    - Fixed report routes decorator mismatch by using a single multi-path GET route for both:
      - `/reports/admin`
      - `/reports/escalated`
    - Escalated query remains strict:
      - `where: { status: ReportStatus.ESCALATED }`
  - Incoming order visibility edge case:
    - Incoming orders no longer silently disappear due to session-open gating and session `from` filtering.
    - Incoming tab continues to target lifecycle statuses (`RECEIVED`, `PREPARING`) while avoiding exclusion of active new orders.
  - Super admin double sidebar:
    - Removed internal dashboard sidebar block from admin dashboard page.
    - Super admin now relies on shared `RoleShell` sidebar only.
  - Cancellation reason dropdown behavior:
    - Incoming `RECEIVED` cancellations now show reason selection:
      - `OUT_OF_STOCK`, `BUSY`, `INTERNAL_ISSUE`, `OTHER`
    - `OTHER` now prompts for required comment.
    - Today-flow cancellation after `READY` keeps default `INTERNAL_ISSUE` (no dropdown).
  - Verification UX navigation:
    - Added `Go to Verification Page` button on student home unverified banner.
    - Redirects to `/auth/verify`.
  - POS order number UX:
    - Added optional POS reference input on received order cards in restaurant incoming workflow.
    - Saved through existing endpoint (`PATCH /order/:id/pos`) during transition to preparing.
    - Helper note added: `Optional: Match app order number with POS system number.`
  - Product extras & sauces clutter:
    - Student product modal now defaults to core info.
    - Sauces and extras rendered via collapsible toggles:
      - `View Sauces` / `Hide Sauces`
      - `View Extras` / `Hide Extras`
  - Favicon internal mark scaling:
    - `logo-icon.svg` updated to reduce perceived inner padding and increase icon occupancy.
    - Favicon PNG set regenerated (`16`, `32`, `48`, `192`, `512`, Apple `180`).
  - WebSocket reliability audit:
    - Verified room joins:
      - restaurant -> `restaurant:{restaurantId}`
      - student -> `student:{userId}`
      - super admin -> `super-admin`
    - Verified key emits are present:
      - `order:new`
      - `order:statusChanged`
      - `notification:new`
    - No architectural rewrite performed.

- Build verification:
  - Backend: `npm run build` in `backend/` (success).
  - Frontend: `npm run build` in project root (success).

- Files modified:
  - `backend/src/auth/auth.controller.ts`
  - `backend/src/report/report.controller.ts`
  - `app/auth/oauth-success/page.tsx` (new)
  - `app/admin/dashboard/page.tsx`
  - `components/RestaurantOrdersView.tsx`
  - `app/student/home/page.tsx`
  - `app/student/home/home.module.css`
  - `app/student/restaurant/[id]/page.tsx`
  - `app/student/restaurant/[id]/menu.module.css`
  - `public/logo-icon.svg`
  - `public/favicon-16x16.png`
  - `public/favicon-32x32.png`
  - `public/favicon-48x48.png`
  - `public/favicon-192x192.png`
  - `public/favicon-512x512.png`
  - `public/apple-touch-icon.png`
  - `CURRENT_STATE_SNAPSHOT.md`

- Financial logic confirmation:
  - No changes made to financial accounting calculations.
  - No changes made to service fee logic.
  - No changes made to `COUNTER` payment availability.
  - No changes made to payment/refund business rules.
