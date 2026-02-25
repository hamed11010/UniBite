# Project Structure (Current)

This document reflects the current structure in `c:\Users\ahmed\Desktop\UniBite`.

## Root

```text
UniBite/
|- .github/
|- .next/                      (build output)
|- app/                        (Next.js App Router frontend)
|- backend/                    (NestJS + Prisma backend)
|- components/                 (shared frontend components)
|- lib/                        (frontend API/auth utilities)
|- node_modules/               (dependencies)
|- public/                     (static assets)
|- .dockerignore
|- .env.local
|- .eslintrc.json
|- .gitignore
|- dockerfile
|- FILES_CHECKLIST.md
|- MANUAL_ACTIONS.md
|- next-env.d.ts
|- next.config.js
|- package-lock.json
|- package-project.ps1
|- package.json
|- PROJECT_STRUCTURE.md
|- PROMPT_LOG.md
|- README.md
|- tsconfig.json
\- tsconfig.tsbuildinfo
```

## Frontend (`app/`)

```text
app/
|- admin/
|  \- dashboard/
|     |- admin.module.css
|     \- page.tsx
|- auth/
|  |- forgot-password/
|  |  \- page.tsx
|  |- login/
|  |  |- auth.module.css
|  |  \- page.tsx
|  |- signup/
|  |  \- page.tsx
|  \- verify/
|     \- page.tsx
|- maintenance/
|  \- page.tsx
|- restaurant/
|  \- dashboard/
|     |- dashboard.module.css
|     \- page.tsx
|- student/
|  |- cart/
|  |  |- cart.module.css
|  |  \- page.tsx
|  |- home/
|  |  |- home.module.css
|  |  \- page.tsx
|  |- order/
|  |  \- [id]/
|  |     |- order.module.css
|  |     \- page.tsx
|  |- restaurant/
|  |  \- [id]/
|  |     |- menu.module.css
|  |     \- page.tsx
|  \- layout.tsx
|- globals.css
|- layout.tsx
|- page.module.css
\- page.tsx
```

## Public Assets (`public/`)

```text
public/
|- apple-touch-icon.png
|- favicon-16x16.png
|- favicon-32x32.png
|- logo-full.svg
\- logo-icon.svg
```

## Frontend Shared

```text
components/
\- RestaurantOrdersView.tsx

lib/
|- api.ts
|- auth.ts
\- mockData.ts
```

## Backend (`backend/`)

```text
backend/
|- dist/                       (compiled backend output)
|- node_modules/
|- prisma/
|  |- migrations/
|  |  |- migration_lock.toml
|  |  |- 20260202021453_init_auth/
|  |  |- 20260203032855_add_university_model/
|  |  |- 20260206082350_add_menu_models/
|  |  |- 20260210135042_add_restaurant_open_close_state/
|  |  |- 20260213130718_add_max_concurrent_orders/
|  |  |- 20260213131519_add_orders/
|  |  |- 20260213142708_add_global_config/
|  |  |- 20260213150730_add_report_system/
|  |  |- 20260213155226_add_disabled_at_to_restaurant/
|  |  |- 20260217141000_add_order_cancellation_and_refund_fields/
|  |  |- 20260217152000_payment_method_backend_foundation/
|  |  \- 20260217170000_add_pos_order_number/
|  \- schema.prisma
|- src/
|  |- auth/
|  |  |- dto/
|  |  |  |- login.dto.ts
|  |  |  \- signup.dto.ts
|  |  |- strategies/
|  |  |  \- jwt.strategy.ts
|  |  |- auth.controller.ts
|  |  |- auth.module.ts
|  |  \- auth.service.ts
|  |- common/
|  |  |- decorators/
|  |  |  \- roles.decorator.ts
|  |  \- guards/
|  |     |- jwt-auth.guard.ts
|  |     |- restaurant-owner.guard.ts
|  |     \- roles.guard.ts
|  |- config/
|  |  |- dto/
|  |  |  \- update-config.dto.ts
|  |  |- config.controller.ts
|  |  |- config.module.ts
|  |  \- config.service.ts
|  |- menu/
|  |  |- dto/
|  |  |  |- create-category.dto.ts
|  |  |  |- create-product.dto.ts
|  |  |  |- update-category.dto.ts
|  |  |  \- update-product.dto.ts
|  |  |- menu.controller.ts
|  |  |- menu.module.ts
|  |  \- menu.service.ts
|  |- order/
|  |  |- dto/
|  |  |  |- cancel-order-by-restaurant.dto.ts
|  |  |  |- create-order.dto.ts
|  |  |  |- update-order-pos.dto.ts
|  |  |  \- update-order-status.dto.ts
|  |  |- order.controller.ts
|  |  |- order.module.ts
|  |  \- order.service.ts
|  |- prisma/
|  |  |- prisma.module.ts
|  |  \- prisma.service.ts
|  |- report/
|  |  |- dto/
|  |  |  \- create-report.dto.ts
|  |  |- report.controller.ts
|  |  |- report.module.ts
|  |  \- report.service.ts
|  |- restaurant/
|  |  |- dto/
|  |  |  |- create-restaurant.dto.ts
|  |  |  \- update-restaurant-settings.dto.ts
|  |  |- restaurant.controller.ts
|  |  |- restaurant.module.ts
|  |  |- restaurant.service.spec.ts
|  |  \- restaurant.service.ts
|  |- university/
|  |  |- dto/
|  |  |  |- create-university.dto.ts
|  |  |  \- update-university.dto.ts
|  |  |- university.controller.ts
|  |  |- university.module.ts
|  |  \- university.service.ts
|  |- users/
|  |  |- dto/
|  |  |  \- create-user.dto.ts
|  |  |- users.module.ts
|  |  \- users.service.ts
|  |- app.controller.spec.ts
|  |- app.controller.ts
|  |- app.module.ts
|  |- app.service.ts
|  \- main.ts
|- test/
|- .env
|- .gitignore
|- .prettierrc
|- docker-compose.yml
|- eslint.config.mjs
|- migration_output.txt
|- migration_output_2.txt
|- nest-cli.json
|- package-lock.json
|- package.json
|- prismaschema.prisma
|- README.md
|- test_output.txt
|- test_output_2.txt
|- tsconfig.build.json
\- tsconfig.json
```

## Notes

- The folder map above is documentation only and does not change architecture.
- Generated/runtime folders (`.next`, `node_modules`, `backend/dist`) are included for completeness.
- Current major backend domain modules: `auth`, `university`, `restaurant`, `menu`, `order`, `report`, `config`.
- Prompt 19 update (February 17, 2026): added Prisma migration for payment enum transition (`DEMO -> COUNTER`) and secure `cardLast4` storage.
- Prompt 21 update (February 17, 2026): added `Order.posOrderNumber` migration and a new order DTO for POS reference updates.
- Prompt 27 branding update (February 20, 2026): normalized browser/tab assets in `public/` and wired icon metadata in `app/layout.tsx`.
