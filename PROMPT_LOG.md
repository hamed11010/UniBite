# Prompt Log

This file tracks all prompts and their implementations.

## Prompt 1

**What was requested:**
Build the complete frontend UI/UX for UniBite using Next.js (App Router) with PWA support. The application should include:

1. **University Selection Page** - Before login, users select their university (only MIU available, others coming soon)
2. **Authentication Screens** - Login and Signup with email/password (only @miuegypt.edu.eg emails allowed)
3. **Student Experience:**
   - Student Home with restaurant listings
   - Restaurant Menu Page with product cards and modal for adding items
   - Cart & Checkout functionality
   - Order Status screen with real-time updates
4. **Restaurant Admin Dashboard:**
   - Orders management (mark as preparing, ready, cancel)
   - Menu Management (placeholder for future implementation)
   - Settings (open/close toggle, working hours)
5. **Platform Admin Dashboard:**
   - View all restaurants
   - Add/remove restaurants
   - Force open/close restaurants
   - Assign restaurant admins (placeholder)

**What was implemented:**
- Complete Next.js project setup with App Router and PWA configuration
- University Selection page with MIU as active option
- Authentication pages (Login & Signup) with email validation
- Student Home page displaying restaurants with open/closed status
- Restaurant Menu page with categorized products, product modal with quantity selector, sauces selection, and comment field
- Cart page with item management (quantity, remove) and checkout
- Order Status page with status updates (received → preparing → ready)
- Restaurant Admin Dashboard with three tabs: Orders, Menu Management, Settings
- Platform Admin Dashboard for managing restaurants
- Mock data system using sessionStorage for state management
- Clean, modern UI with gradient themes and responsive design

**Files touched:**
- `package.json` - Project dependencies
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `.gitignore` - Git ignore rules
- `public/manifest.json` - PWA manifest
- `app/layout.tsx` - Root layout with PWA meta tags
- `app/globals.css` - Global styles
- `app/page.tsx` - University Selection page
- `app/page.module.css` - University Selection styles
- `app/auth/login/page.tsx` - Login page
- `app/auth/signup/page.tsx` - Signup page
- `app/auth/login/auth.module.css` - Auth page styles
- `app/student/home/page.tsx` - Student home page
- `app/student/home/home.module.css` - Student home styles
- `app/student/restaurant/[id]/page.tsx` - Restaurant menu page
- `app/student/restaurant/[id]/menu.module.css` - Menu page styles
- `app/student/cart/page.tsx` - Cart page
- `app/student/cart/cart.module.css` - Cart styles
- `app/student/order/[id]/page.tsx` - Order status page
- `app/student/order/[id]/order.module.css` - Order status styles
- `app/restaurant/dashboard/page.tsx` - Restaurant admin dashboard
- `app/restaurant/dashboard/dashboard.module.css` - Restaurant dashboard styles
- `app/admin/dashboard/page.tsx` - Platform admin dashboard
- `app/admin/dashboard/admin.module.css` - Admin dashboard styles
- `lib/mockData.ts` - Mock data and TypeScript interfaces

**Important notes / assumptions:**
- All authentication and data persistence uses sessionStorage (mock implementation)
- User roles are determined by email pattern (admin emails contain "admin")
- Restaurant admins are assigned to restaurant ID "rest1" by default
- Platform admin role requires email containing "platform_admin" (not fully implemented in mock)
- Menu Management section in restaurant dashboard is a placeholder (UI structure ready for backend integration)
- Sauce management is simplified - restaurants can enable/disable sauces per product
- Order status updates are simulated with setTimeout (in real app, would use WebSockets or polling)
- All images use placeholders (emoji or empty divs)
- No real payment integration - checkout directly creates order
- Cart items are stored per session, not per user account

## Prompt 2

**What was requested:**
Adjust role logic, Super Admin view, and "Coming Soon" restaurants functionality:

1. **Role & Email Rules (Mock):**
   - Student: Any @miuegypt.edu.eg email (can sign up)
   - Restaurant Admin: `miniadmintest@anything.com` (explicit, cannot sign up)
   - Super Admin: `superadmintest@anything.com` (explicit, cannot sign up)
   - Roles must NOT be inferred by email text - explicit assignment only

2. **Super Admin Dashboard Enhancements:**
   - Add overview cards: Total students, Total restaurants, Active restaurants, Total orders, Orders today
   - Add "Coming Soon" toggle for restaurants
   - Add Enable/Disable toggle for restaurants
   - Keep existing features (add, remove, force open/close)

3. **Student View - Coming Soon Restaurants:**
   - Students see active restaurants (clickable)
   - Students see "Coming Soon" restaurants (visible but disabled/greyed out)
   - "Coming Soon" restaurants show label and are not clickable
   - Disabled restaurants are hidden from students

**What was implemented:**
- Updated `Restaurant` interface to include `comingSoon` and `enabled` boolean fields
- Updated mock data with "Coming Soon" restaurant examples
- Refactored login page with explicit role assignment (not inferred from email text)
- Updated signup page to clarify only students can sign up
- Enhanced Super Admin dashboard with:
  - Overview cards showing mock statistics
  - "Coming Soon" toggle button for each restaurant
  - Enable/Disable toggle button for each restaurant
  - Updated role check from 'platform_admin' to 'super_admin'
- Updated student home page to:
  - Display "Coming Soon" restaurants with special styling
  - Filter out disabled restaurants
  - Show "Coming Soon" badge for coming soon restaurants
  - Make coming soon restaurants non-clickable
- Added CSS styles for coming soon badges and overview cards

**Files touched:**
- `lib/mockData.ts` - Added `comingSoon` and `enabled` fields to Restaurant interface, added coming soon restaurants to mock data
- `app/auth/login/page.tsx` - Refactored to use explicit role assignment based on specific email patterns
- `app/auth/signup/page.tsx` - Updated hint text to clarify only students can sign up
- `app/student/home/page.tsx` - Added coming soon restaurant display logic and filtering
- `app/student/home/home.module.css` - Added styles for coming soon restaurants and badges
- `app/admin/dashboard/page.tsx` - Added overview cards, coming soon toggle, enable/disable toggle, updated role check
- `app/admin/dashboard/admin.module.css` - Added styles for overview cards, stat cards, and new status badges

**Notes / assumptions:**
- Role assignment is explicitly based on exact email matches (superadmintest@anything.com, miniadmintest@anything.com) or @miuegypt.edu.eg domain
- Mock statistics in overview cards are hardcoded - in production would come from API
- "Coming Soon" restaurants are visible to students but non-interactive
- Disabled restaurants are completely hidden from student view
- All role logic is clearly commented as MOCK/DEMO only
- Super Admin role name changed from 'platform_admin' to 'super_admin' for consistency
- Coming Soon and Disabled are separate states - a restaurant can be coming soon but still enabled

## Prompt 3

**What was requested:**
Frontend UX & UI refinement based on real UX feedback:

1. **University Selection Page:**
   - Show ONLY Misr International University
   - Remove all other university names (even disabled ones)
   - Show generic "Other universities coming soon" text below MIU

2. **Student Menu UI Polish:**
   - Fix sauces/extras visual inconsistency
   - Ensure equal padding, margins, and uniform alignment for all sauce options
   - Improve layout for clean, balanced, visually consistent appearance

3. **Restaurant Admin Dashboard:**
   - Orders Tab: Add mock/demo orders with status buttons (Received, Preparing, Ready)
   - Menu Management Tab: Replace placeholder with real UI design showing categories, products, add buttons, product fields
   - Settings Tab: Keep as is

4. **Super Admin Dashboard:**
   - Enhance restaurant creation to include email and password fields
   - Set restaurant status (active/coming soon) during creation
   - Display created credentials clearly for sharing with restaurant owners

5. **Authentication Screens:**
   - Login: Remove email hints/placeholder text under email input
   - Signup: Add clear text "Students must sign up using their university email" and remove confusing placeholders
   - Forgot Password: New page (UI only) with email input and submit
   - Verify Account: New page (UI only) with OTP code input fields

**What was implemented:**
- Updated university selection to show only MIU with generic "coming soon" message
- Fixed sauces UI with consistent padding (8px vertical), margins, and alignment (20px checkbox, 12px gap)
- Added mock orders to restaurant dashboard with status transition buttons
- Created complete Menu Management UI with:
  - Category list with add category functionality
  - Products within categories with add product form
  - Product cards showing name, price, description, image placeholder, sauce badge
  - Edit/Delete buttons (UI only)
- Enhanced Super Admin restaurant creation:
  - Added email and password fields
  - Added status selector (active/coming soon)
  - Credentials display box after creation
- Updated Login page: Removed email hint, changed placeholder to neutral text
- Updated Signup page: Added clear info text about university email requirement
- Created Forgot Password page with email input and success state
- Created Verify Account page with 6-digit OTP input and auto-focus navigation
- Added Forgot Password link to Login page

**Files touched:**
- `app/page.tsx` - Updated to show only MIU
- `app/page.module.css` - Added style for "other universities" text
- `app/student/restaurant/[id]/menu.module.css` - Fixed sauces alignment and spacing
- `app/restaurant/dashboard/page.tsx` - Added mock orders, created Menu Management UI
- `app/restaurant/dashboard/dashboard.module.css` - Added styles for menu management components
- `app/admin/dashboard/page.tsx` - Enhanced restaurant creation with credentials
- `app/admin/dashboard/admin.module.css` - Added styles for credentials display
- `app/auth/login/page.tsx` - Removed hints, added forgot password link
- `app/auth/signup/page.tsx` - Added clear university email text
- `app/auth/login/auth.module.css` - Added styles for new auth pages
- `app/auth/forgot-password/page.tsx` - New page (UI only)
- `app/auth/verify/page.tsx` - New page (UI only)

**Notes / assumptions:**
- All new pages are UI-only with no backend integration
- Mock orders are added automatically if no orders exist in sessionStorage
- Menu Management UI is fully functional for demo but uses local state (not persisted)
- Restaurant credentials are displayed after creation but not stored (mock only)
- OTP verification page uses 6-digit code input with auto-focus between fields
- Forgot password shows success message but doesn't actually send emails
- All UI improvements focus on visual consistency and user-friendly design

## Prompt 4

**What was requested:**
Complete missing restaurant management, menu editing, add-ons, and admin safety features so the app feels functional, safe, and realistic — without backend integration:

1. **Restaurant Dashboard - Menu Management:**
   - Replace placeholder with real, interactive UI
   - Render visible list of categories and products
   - Each product card shows: name, base price, description, image placeholder, Edit/Delete buttons
   - Edit/Create Product modal with:
     - Basic fields: product name, base price, description
     - Sauces (Extras): Add sauce name with optional price (0 = free), multiple sauces allowed
     - Ingredients/Add-ons: Add ingredient name with optional price
   - Save updates local state, Delete removes product from local state
   - Add/Edit/Delete visibly update UI immediately
   - Show "Changes are saved locally (demo mode)" text

2. **Restaurant Dashboard - Orders & Safety:**
   - Orders Tab: Render mock orders by default if none exist
   - Each order card shows: ordered items, quantity, selected sauces & add-ons, student comments, order status
   - Status buttons: Received, Preparing, Ready
   - Order History: Split into "Today's Orders" and "Order History (coming soon)"
   - Explain visually that older orders will be auto-archived later (backend feature)

3. **Student View - Add-ons Pricing:**
   - When student selects a product, sauces & ingredients appear
   - Prices update total dynamically
   - Free vs paid extras are clear

4. **Super Admin Dashboard - Safety & Control:**
   - Restaurant Creation (Extended): When adding a restaurant, Super Admin must input:
     - Restaurant name
     - Status (Active / Coming Soon)
     - Working hours
     - Restaurant Admin Credentials: Login email, Password
     - Restaurant Responsible Person: Full name, Phone number
   - After creation: Display summary card showing all information
   - Note clearly: "Passwords are visible in demo mode only."
   - Basic Analytics (Mock): Add dashboard section with cards:
     - Total restaurants
     - Total orders today
     - Restaurant with most orders today

**What was implemented:**
- Complete Menu Management UI with full CRUD operations:
  - Categories and products displayed in organized cards
  - Edit/Delete buttons functional on each product
  - Modal for creating/editing products with all required fields
  - Sauces section: Add multiple sauces with names and prices (0 = free)
  - Add-ons section: Add multiple ingredients/add-ons with names and prices
  - All changes saved to sessionStorage (restaurantMenu)
  - Demo mode notice displayed
- Orders Tab enhancements:
  - Mock orders displayed by default
  - Order cards show all details: items, quantities, sauces, add-ons, comments, status
  - Status buttons allow transitions between Received, Preparing, Ready
  - Order History section split into "Today's Orders" and "Order History (coming soon)"
  - Visual explanation about auto-archiving
- Student View add-ons pricing:
  - Menu loads from sessionStorage (restaurantMenu) if available, falls back to mockMenu
  - Sauces and add-ons display with prices (e.g., "Ketchup (+2 EGP)" or "Extra Cheese (Free)")
  - Total price updates dynamically as user selects sauces/add-ons
  - Cart items include calculated prices with add-ons
- Super Admin Dashboard enhancements:
  - Extended restaurant creation form with:
    - Restaurant name, status, working hours (existing)
    - Restaurant Admin Credentials: email and password fields
    - Restaurant Responsible Person: full name and phone number
  - Summary card after creation showing all information
  - Password visibility warning in demo mode
  - Basic Analytics section with three cards:
    - Total restaurants (dynamic based on current restaurants)
    - Orders today (mock value: 87)
    - Restaurant with most orders today (mock value: first restaurant name)

**Files touched:**
- `app/restaurant/dashboard/page.tsx` - Complete Menu Management implementation with CRUD, sauces, add-ons; Orders tab with history section
- `app/restaurant/dashboard/dashboard.module.css` - Styles for menu management, extras sections, order history, demo note
- `app/student/restaurant/[id]/page.tsx` - Updated to support add-ons pricing, dynamic total calculation, loading from sessionStorage
- `app/admin/dashboard/page.tsx` - Extended restaurant creation, analytics section, summary card
- `app/admin/dashboard/admin.module.css` - Styles for password note, analytics cards
- `PROMPT_LOG.md` - Added Prompt 4 documentation

**Notes / assumptions:**
- Menu Management uses sessionStorage key "restaurantMenu" to persist changes
- Student view attempts to load from sessionStorage first, falls back to mockMenu for backward compatibility
- Sauces and add-ons support both new structure (with prices) and legacy structure (free sauces)
- All pricing calculations happen client-side in real-time
- Order History "coming soon" section is UI-only placeholder
- Analytics values are mock/demo data - in production would come from API
- Restaurant creation summary card displays all credentials including password (demo mode only)
- All functionality is frontend-only using local state and sessionStorage

## Prompt 5

**What was requested:**
Implement product availability control, optional stock tracking, and admin-level overrides so the system behaves realistically — while ensuring students NEVER see stock numbers:

1. **Restaurant Dashboard - Product Availability:**
   - Each product includes stock tracking toggle: "Track stock for this product"
   - If enabled, show numeric input for stock quantity (internal only)
   - Manual out-of-stock override toggle: "Mark as Out of Stock" (always available, overrides stock)
   - Product cards show Available/Out of Stock indicators
   - Visual state updates instantly when toggled

2. **Student View - Strict Availability Rules:**
   - Students must NEVER see stock numbers
   - Out-of-stock products are visible but disabled
   - Show "Out of Stock" label on disabled products
   - Product modal must NOT open for out-of-stock products
   - Only see: Enabled product → clickable, Disabled product → "Out of Stock"

3. **Order Flow - Safety UI:**
   - Orders placed before product is marked out of stock remain visible
   - Restaurant admin can see orders containing unavailable products
   - If order is cancelled by restaurant: Show "Cancelled by restaurant" status
   - Display explanation text (UI only, no notifications/refunds)

4. **Restaurant Dashboard - Manual Open/Close:**
   - Show scheduled working hours
   - Manual toggle for Open/Closed
   - Manual toggle overrides schedule visually
   - Updates student view immediately
   - Label: "Manually overridden (demo mode)"

5. **Super Admin Dashboard - Restaurant Selection:**
   - Add restaurant selector dropdown
   - Default option: "All Restaurants"
   - When restaurant selected, dashboard stats update to reflect that restaurant only
   - Label: "Stats for: {Restaurant Name}"

**What was implemented:**
- Product availability system with stock tracking:
  - Updated Product interface to include: `trackStock`, `stockQuantity`, `isOutOfStock`
  - Stock tracking toggle in product form (optional)
  - Stock quantity input shown only when tracking is enabled (marked as "Internal Only")
  - Manual out-of-stock override toggle (always available, overrides stock tracking)
  - Product cards display ✅ Available or ❌ Out of Stock badges
  - Visual indicators update instantly when toggles change
  - Stock information shown only in admin view (never in student view)
- Student view availability enforcement:
  - `isProductAvailable()` function checks availability (manual override or stock quantity)
  - Out-of-stock products are visible but disabled (opacity reduced, cursor: not-allowed)
  - "Out of Stock" badge displayed on unavailable products
  - Product modal prevented from opening for out-of-stock products
  - Stock numbers completely hidden from student view
- Order flow safety:
  - Order status updated to support "cancelled_by_restaurant"
  - Cancelled orders display "Cancelled by Restaurant" badge
  - Explanation text shown: "This order was cancelled by the restaurant. (UI only - no notifications or refunds in demo mode)"
  - Orders remain visible even if products become unavailable
- Restaurant settings manual override:
  - Scheduled hours displayed: "Scheduled Hours: {openTime} - {closeTime}"
  - Manual open/close toggle with immediate effect
  - "Manually overridden (demo mode)" label shown when toggle is used
  - Restaurant status updates in sessionStorage for student view
- Super Admin restaurant selector:
  - Dropdown selector with "All Restaurants" as default
  - Individual restaurant selection filters stats
  - Stats update dynamically: total restaurants, orders today, top restaurant
  - "Stats for: {Restaurant Name}" label displayed when specific restaurant selected

**Files touched:**
- `app/restaurant/dashboard/page.tsx` - Added stock tracking, availability toggles, product indicators, order cancellation status, settings manual override
- `app/restaurant/dashboard/dashboard.module.css` - Styles for stock section, availability badges, cancellation notes, schedule info
- `app/student/restaurant/[id]/page.tsx` - Added availability checking, disabled out-of-stock products, hidden stock numbers
- `app/student/restaurant/[id]/menu.module.css` - Styles for out-of-stock products, availability badges
- `app/admin/dashboard/page.tsx` - Added restaurant selector dropdown with filtered stats
- `app/admin/dashboard/admin.module.css` - Styles for restaurant selector, selected restaurant note
- `PROMPT_LOG.md` - Added Prompt 5 documentation

**Notes / assumptions:**
- Stock tracking is optional - products can exist without stock tracking
- Manual out-of-stock override always takes precedence over stock tracking
- Stock quantities are internal/admin-only - never displayed to students
- Student view shows only availability status (Available/Out of Stock), never numbers
- Out-of-stock products in student view are visible but non-interactive (cannot click/open modal)
- Order cancellation is UI-only - no real notifications or refunds in demo mode
- Manual restaurant open/close override updates sessionStorage for immediate student view reflection
- Super Admin restaurant selector uses mock stats - in production would filter real data from API
- All availability changes update UI instantly using React state
- Product availability state persisted in sessionStorage (restaurantMenu)

## Prompt 6

**What was requested:**
Ensure that product availability features implemented earlier (stock tracking & out-of-stock toggles) persist and render correctly after refresh by updating the mock data schema.

**What was implemented:**
- Extended Product interface in `lib/mockData.ts` to include optional availability fields:
  - `trackStock?: boolean` - Whether stock tracking is enabled for the product
  - `stockQuantity?: number | null` - Current stock quantity (null when not tracking)
  - `isOutOfStock?: boolean` - Manual out-of-stock override flag
- Updated all products in `mockMenu` to include default availability values:
  - `trackStock: false` - Stock tracking disabled by default
  - `stockQuantity: null` - No stock quantity when tracking is disabled
  - `isOutOfStock: false` - All products available by default
- Applied defaults to all 6 products across 3 restaurants (rest1, rest2, rest3)

**Files touched:**
- `lib/mockData.ts` - Extended Product interface and added default availability fields to all mockMenu products
- `PROMPT_LOG.md` - Added Prompt 6 documentation

**Notes / assumptions:**
- Updated Product schema to support stock & availability
- Added default availability fields to mockMenu products
- Ensured frontend availability logic persists after refresh
- Default values ensure products are available by default, stock tracking is optional, and manual out-of-stock works
- No UI changes made - this is data-only alignment
- Stock numbers remain hidden from students (enforced by existing UI logic)

## Prompt 7

**What was requested:**
Improve trust, safety, and accountability by adding a student-facing restaurant report feature, admin visibility into reports, and responsible restaurant onboarding, all in a frontend-only, demo-mode implementation.

**What was implemented:**
- Student restaurant reports:
  - Added a **"Report an issue"** button on the student restaurant menu page, visible only to students.
  - Implemented a modal with predefined reasons (“Restaurant is closed”, “Order accepted but not prepared”, “Restaurant says they don’t use this app”, “Other issue”) plus an optional text field.
  - On submit, reports are stored in `sessionStorage` under `reports`, and a confirmation message is shown along with a note: “Reports are reviewed automatically in production (demo mode).”
- Restaurant admin reports view:
  - Added a **Reports** tab to the restaurant dashboard that lists reports only for the current restaurant.
  - Each report shows reason, time, and a simple “New” status, with explanatory trust & safety text indicating that production would use automated handling at scale (demo only).
- Super Admin reports overview:
  - In the Super Admin dashboard, added a **Reports Overview** section summarizing:
    - Restaurant name
    - Number of reports
    - Most common reason per restaurant
  - Included UI-only messaging that restaurants may be auto-disabled based on reports/inactivity in production, with manual review at scale.
- Responsible restaurant onboarding:
  - Extended restaurant creation to include:
    - University field
    - Responsible person full name
    - Contact email and phone (using existing email/phone fields)
    - Mandatory responsibility checkbox: “I confirm that I am responsible for fulfilling orders received through UniBite.”
  - Blocked restaurant creation unless the responsibility checkbox is checked.
  - Added helper text: “UniBite does not collect personal IDs. Responsibility is enforced through platform rules. (demo mode)”

**Files touched:**
- `app/student/restaurant/[id]/page.tsx` - Added student-only “Report an issue” button, report modal, and sessionStorage-based report submission.
- `app/student/restaurant/[id]/menu.module.css` - Styles for header actions, report button, and report modal elements.
- `app/restaurant/dashboard/page.tsx` - Added Reports tab and per-restaurant report listing with trust & safety messaging.
- `app/admin/dashboard/page.tsx` - Added reports overview summary and extended restaurant onboarding with university + responsibility confirmation.
- `app/admin/dashboard/admin.module.css` - Styles for responsibility checkbox and reports overview layout.
- `PROMPT_LOG.md` - Added Prompt 7 documentation.

**Notes / assumptions:**
- Reports are mock-only and stored in `sessionStorage`; no backend or real moderation exists.
- Students never see internal stock or sensitive admin data—only high-level availability and the reporting UI.
- Trust & safety automation (auto-disabling restaurants, large-scale moderation) is described in UI text but not implemented.
- Onboarding avoids collecting any sensitive ID documents; responsibility is acknowledged via checkbox only.

## Prompt 8

**What was requested:**
Implement Backend Phase 1: Production-grade authentication system with:
1. **Prisma & Database Setup:**
   - Install and initialize Prisma
   - Create User model with UUID, email (unique), password (hashed), role enum (STUDENT, RESTAURANT_ADMIN, SUPER_ADMIN), createdAt
   - Use Prisma migrations (not db push)
2. **Authentication Implementation:**
   - Create auth and users modules with clean separation
   - Use bcrypt for password hashing
   - JWT access tokens stored in httpOnly cookies
   - Secure cookie settings (Secure-ready, SameSite aware)
3. **Required Endpoints:**
   - POST /auth/signup (student signup only)
   - POST /auth/login (validate credentials, issue JWT cookie)
   - POST /auth/logout (clear cookie)
   - GET /auth/me (returns current user, requires valid cookie)
4. **Authorization & Guards:**
   - Authentication Guard (JWT)
   - Role Guard (RBAC)
   - Reusable guards with decorators for roles
5. **Project Structure:**
   - Clean folder structure: auth/, users/, prisma/, common/guards/, common/decorators/
6. **Documentation:**
   - Update backend/README.md with setup, Docker, migrations, cookies
   - Append backend structure to PROJECT_STRUCTURE.md
   - Add Prompt 8 to PROMPT_LOG.md

**What was implemented:**
- **Prisma Setup:**
  - Installed Prisma and Prisma Client
  - Initialized Prisma with PostgreSQL datasource
  - Created User model with all required fields and Role enum
  - Configured Prisma service module (global)
- **Users Module:**
  - UsersService with create, findByEmail, findById methods
  - CreateUserDto with validation (email, password min 8 chars)
  - Password hashing with bcrypt (10 rounds)
  - Email uniqueness validation
- **Authentication Module:**
  - AuthService with signup (student only), login, validateUser methods
  - AuthController with all 4 required endpoints
  - JWT strategy for Passport (extracts token from httpOnly cookies)
  - SignupDto and LoginDto with class-validator
  - JWT tokens signed with configurable secret
- **Guards & Authorization:**
  - JwtAuthGuard extends Passport AuthGuard
  - RolesGuard for role-based access control
  - @Roles() decorator for route protection
  - Guards are reusable and composable
- **Cookie Configuration:**
  - httpOnly cookies for JWT storage
  - Secure flag for production
  - SameSite: 'strict' for CSRF protection
  - 24-hour expiration
- **Application Configuration:**
  - Updated main.ts with CORS, cookie-parser, ValidationPipe
  - Updated app.module.ts to import PrismaModule, AuthModule, UsersModule
  - Environment variable support (DATABASE_URL, JWT_SECRET, etc.)

**Files touched:**
- `backend/package.json` - Added dependencies: @prisma/client, prisma, @nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcrypt, cookie-parser, class-validator, class-transformer, and dev types
- `backend/prisma/schema.prisma` - Created User model with Role enum
- `backend/prisma.config.ts` - Prisma configuration (generated, updated DATABASE_URL)
- `backend/src/prisma/prisma.service.ts` - Prisma Client service with lifecycle hooks
- `backend/src/prisma/prisma.module.ts` - Global Prisma module
- `backend/src/users/users.service.ts` - User CRUD operations with password hashing
- `backend/src/users/users.module.ts` - Users module
- `backend/src/users/dto/create-user.dto.ts` - User creation DTO
- `backend/src/auth/auth.service.ts` - Authentication business logic
- `backend/src/auth/auth.controller.ts` - Auth endpoints (signup, login, logout, me)
- `backend/src/auth/auth.module.ts` - Auth module with JWT configuration
- `backend/src/auth/dto/signup.dto.ts` - Signup validation DTO
- `backend/src/auth/dto/login.dto.ts` - Login validation DTO
- `backend/src/auth/strategies/jwt.strategy.ts` - Passport JWT strategy (cookie-based)
- `backend/src/common/guards/jwt-auth.guard.ts` - JWT authentication guard
- `backend/src/common/guards/roles.guard.ts` - Role-based access control guard
- `backend/src/common/decorators/roles.decorator.ts` - @Roles() decorator
- `backend/src/main.ts` - Added CORS, cookie-parser, ValidationPipe
- `backend/src/app.module.ts` - Imported PrismaModule, AuthModule, UsersModule
- `backend/README.md` - Complete backend documentation (setup, Docker, migrations, cookies, API docs)
- `PROJECT_STRUCTURE.md` - Appended backend structure section
- `PROMPT_LOG.md` - Added Prompt 8 documentation

**Notes / assumptions:**
- Prisma 7 uses prisma.config.ts for DATABASE_URL (not in schema.prisma)
- JWT secret defaults to placeholder string - must be changed in production
- Only students can sign up via /auth/signup endpoint
- Restaurant admins and super admins must be created through other means (future implementation)
- Cookie secure flag is set based on NODE_ENV (true in production, false in development)
- CORS is configured for frontend origin (default: http://localhost:3001)
- Password minimum length is 8 characters (enforced via DTO validation)
- All endpoints use class-validator for input validation
- Prisma migrations must be run manually: `npx prisma migrate dev`
- Prisma Client must be generated: `npx prisma generate`
- Database runs via Docker Compose (docker-compose.yml already existed)
- No refresh token implementation yet (only access token)
- Frontend is frozen and not modified in this phase

## Prompt 8 (Phase 2A) - Dynamic University System

**What was requested:**
Implement a fully dynamic University system where:
1. **Prisma Schema Updates:**
   - Add University model with id, name, allowedEmailDomains (array), isActive, createdAt
   - Add relations: users, restaurants (for future)
   - Extend User model: add universityId (optional), university relation, isVerified (default false)
2. **Backend - University Module:**
   - Create university module with service, controller, DTOs
   - Super Admin only endpoints: create, update, enable/disable, list all
   - Public endpoint: get active universities only (for frontend)
3. **Update Signup Logic:**
   - Require universityId in signup request
   - Validate university exists and is active
   - Validate email domain matches university's allowedEmailDomains
   - Set isVerified = false by default
4. **Frontend Updates:**
   - University selection page: fetch from backend, remove hardcoded universities
   - Signup page: include universityId, validate against selected university
5. **Documentation:**
   - Update PROJECT_STRUCTURE.md with University module
   - Update PROMPT_LOG.md
   - Update MANUAL_ACTIONS.md with migration steps

**What was implemented:**
- **Prisma Schema:**
  - Added University model with all required fields and PostgreSQL array for allowedEmailDomains
  - Extended User model with universityId (optional), university relation, isVerified field
  - Added Restaurant model placeholder for future use
  - All relations properly configured
- **University Module:**
  - UniversityService with create, findAll, findActive, findOne, update, validateEmailDomain methods
  - UniversityController with:
    - Public: GET /university/active (no auth required)
    - Super Admin: POST /university, GET /university, GET /university/:id, PUT /university/:id, PUT /university/:id/status
  - DTOs: CreateUniversityDto, UpdateUniversityDto with validation
  - Email domain validation (must start with @)
- **Signup Logic Updates:**
  - SignupDto now requires universityId (UUID validation)
  - AuthService validates university exists and is active
  - Email domain validation against university's allowedEmailDomains array
  - UsersService.create accepts optional universityId parameter
  - isVerified set to false by default
- **Frontend Updates:**
  - Created lib/api.ts with API utility functions (fetchActiveUniversities, signup, login, etc.)
  - Updated app/page.tsx to fetch universities from backend dynamically
  - Removed hardcoded MIU university
  - Shows "Universities coming soon" if no universities exist
  - Updated app/auth/signup/page.tsx to:
    - Get universityId from sessionStorage
    - Call backend signup API with universityId
    - Handle errors from backend validation
    - Redirect to university selection if no university selected
- **Module Integration:**
  - Added UniversityModule to AppModule imports
  - Added UniversityModule to AuthModule imports (for validation)

**Files touched:**
- `backend/prisma/schema.prisma` - Added University model, extended User model, added Restaurant placeholder
- `backend/src/university/university.service.ts` - University CRUD operations and email domain validation
- `backend/src/university/university.controller.ts` - University endpoints (public + Super Admin)
- `backend/src/university/university.module.ts` - University module
- `backend/src/university/dto/create-university.dto.ts` - University creation DTO
- `backend/src/university/dto/update-university.dto.ts` - University update DTO
- `backend/src/auth/dto/signup.dto.ts` - Added universityId field (UUID validation)
- `backend/src/auth/auth.service.ts` - Added university validation and email domain checking
- `backend/src/auth/auth.module.ts` - Added UniversityModule import
- `backend/src/users/users.service.ts` - Updated create method to accept universityId, set isVerified
- `backend/src/app.module.ts` - Added UniversityModule import
- `lib/api.ts` - New API utility file for backend communication
- `app/page.tsx` - Updated to fetch universities from backend, removed hardcoded MIU
- `app/auth/signup/page.tsx` - Updated to use backend API, include universityId
- `PROJECT_STRUCTURE.md` - Added University module documentation, updated API endpoints
- `PROMPT_LOG.md` - Added Prompt 8 (Phase 2A) documentation

**Notes / assumptions:**
- Prisma migration must be created and applied: `npx prisma migrate dev --name add_university_model`
- Email domains in allowedEmailDomains must start with @ (e.g., "@miuegypt.edu.eg")
- University validation happens server-side - frontend checks are UX only
- Students must select a university before signing up (stored in sessionStorage)
- SUPER_ADMIN users may have universityId = null (not enforced yet)
- RESTAURANT_ADMIN will belong to a university (used in future phases)
- No email verification logic implemented yet (isVerified field exists but not used)
- Frontend API calls use credentials: 'include' for cookie-based auth
- API_BASE_URL defaults to http://127.0.0.1:4000, can be overridden with NEXT_PUBLIC_API_URL
- University selection page redirects to login after selection (existing flow preserved)
- Signup page redirects to university selection if no university selected
- All Super Admin endpoints protected with @Roles(Role.SUPER_ADMIN) guard
- Public /university/active endpoint returns only active universities, sorted by name

## Prompt 9 - Auth Flow Cleanup with University Context

**What was requested:**
Clean up frontend authentication logic to align with production-ready backend:
1. **University Selection Context:**
   - Users must select a university before login or signup
   - Selected universityId is stored and sent with auth requests
2. **Login Flow Updates:**
   - Send email, password, and universityId to POST /auth/login
   - Context-aware frontend validation:
     - STUDENT: Email must end with one of selected university's allowedEmailDomains
     - RESTAURANT_ADMIN: Email domain NOT validated (backend validates university association)
     - SUPER_ADMIN: University selection does not restrict login
   - Display backend error messages clearly
3. **Signup Flow:**
   - STUDENT-only signup
   - Require university selection
   - Validate email domain against selected university (frontend UX only)
4. **Post-Login Routing:**
   - Redirect based on backend response role:
     - SUPER_ADMIN → /admin/dashboard
     - RESTAURANT_ADMIN → /restaurant/dashboard
     - STUDENT → /student/home
5. **Cleanup:**
   - Remove all frontend-only demo logic (hardcoded admin emails, role inference, global email validation)

**What was implemented:**
- **Login Page Cleanup:**
  - Removed all hardcoded role assignment logic (superadmintest@anything.com, miniadmintest@anything.com)
  - Removed email domain validation based on hardcoded @miuegypt.edu.eg
  - Updated to use backend login API with universityId parameter
  - Added university context loading from sessionStorage
  - Implemented backend response-based routing (role from backend)
  - Added loading states and proper error handling
  - Added university selection requirement check
- **API Function Updates:**
  - Updated login() function to accept optional universityId parameter
  - universityId sent to backend in login request body
- **Signup Page:**
  - Already correctly implemented (no changes needed)
  - Uses backend API with universityId
  - Validates university selection before signup
- **Removed Hardcoded Logic:**
  - No more role inference from email text
  - No hardcoded admin email patterns
  - No global email domain validation
  - All role determination now comes from backend response

**Files touched:**
- `lib/api.ts` - Updated login() function to accept optional universityId parameter
- `app/auth/login/page.tsx` - Complete rewrite to use backend API, removed all hardcoded role logic
- `PROMPT_LOG.md` - Added Prompt 9 documentation

**Notes / assumptions:**
- Backend login endpoint may not yet accept universityId (frontend sends it, backend can ignore for now)
- Frontend validation is UX-only; backend is the final authority
- University selection is required before login (redirects to university selection if missing)
- All role-based routing uses backend response (no frontend role inference)
- Error messages from backend are displayed to user
- Loading states prevent multiple submissions
- Port configuration: Frontend (3001), Backend (4000), Database (5432)
- No backend code was modified (frontend-only changes)
- All hardcoded demo/mock authentication logic removed
- Authentication flow now fully backend-driven

## Prompt 10 - Auth Redirect Loop & Cookie-Only Cleanup

**What was requested:**
Fix critical redirect loop bug where SUPER_ADMIN dashboard would briefly render then immediately redirect back to /auth/login. Fully stabilize authentication using cookies only.

**What was broken:**
1. **Admin Dashboard Redirect Loop:**
   - Broken indentation in useEffect causing auth check to run incorrectly
   - Hardcoded API URL instead of using API utility
   - Code structure caused multiple redirect attempts
2. **SessionStorage Auth Dependencies:**
   - Restaurant dashboard used sessionStorage for auth checks
   - Student home used sessionStorage for auth checks
   - Signup page stored auth state in sessionStorage (misleading)
   - Multiple dashboards had conflicting auth mechanisms
3. **Role Comparison Issues:**
   - Restaurant dashboard used lowercase 'restaurant_admin' instead of 'RESTAURANT_ADMIN'
   - Inconsistent role checking across dashboards

**What was fixed:**
- **Created Centralized Auth Utility (`lib/auth.ts`):**
  - `checkAuth()` function uses `/auth/me` with cookie-based auth
  - `hasRole()` helper for consistent role checking
  - Single source of truth for authentication state
- **Fixed Admin Dashboard:**
  - Replaced broken hardcoded fetch with `checkAuth()` utility
  - Fixed indentation and code structure
  - Ensured auth check runs once and waits for response
  - Proper role validation using `hasRole(user, 'SUPER_ADMIN')`
- **Fixed Restaurant Dashboard:**
  - Replaced sessionStorage auth with cookie-based `checkAuth()`
  - Fixed role comparison to use 'RESTAURANT_ADMIN' (uppercase)
  - Removed invalid `user.restaurantId` reference
- **Fixed Student Home:**
  - Replaced sessionStorage auth with cookie-based `checkAuth()`
  - Updated logout to call backend `/auth/logout` endpoint
  - Proper role validation using `hasRole(user, 'STUDENT')`
- **Fixed Signup Flow:**
  - Removed misleading sessionStorage auth storage
  - After signup, automatically logs in to set cookie
  - Uses cookie-based auth for redirect decisions

**Files touched:**
- `lib/auth.ts` - New centralized auth utility (checkAuth, hasRole)
- `app/admin/dashboard/page.tsx` - Fixed broken auth check, removed hardcoded URL
- `app/restaurant/dashboard/page.tsx` - Replaced sessionStorage with cookie-based auth
- `app/student/home/page.tsx` - Replaced sessionStorage with cookie-based auth, fixed logout
- `app/auth/signup/page.tsx` - Removed sessionStorage auth storage, added auto-login
- `PROMPT_LOG.md` - Added Prompt 10 documentation

**Notes / assumptions:**
- All authentication now uses httpOnly cookies exclusively
- `/auth/me` is the single source of truth for auth state
- sessionStorage is only used for non-auth data (selectedUniversity, orders, reports, etc.)
- Role comparisons use exact backend enum values: 'SUPER_ADMIN', 'RESTAURANT_ADMIN', 'STUDENT'
- All dashboards use the same `checkAuth()` utility for consistency
- Auth checks run once per page load in useEffect
- Redirects only happen if auth fails or role doesn't match
- Page refresh keeps user logged in (cookie persists)
- Logout properly clears backend cookie via `/auth/logout` endpoint
- Student pages (cart, order, restaurant menu) still use sessionStorage for auth but don't cause redirect loops (can be updated later for consistency)

## Prompt 11 - University-First Super Admin Dashboard

**What was requested:**
Refactor Super Admin dashboard to be university-first instead of restaurant-first:
1. **Make Universities Primary Entity:**
   - Default view: list all universities
   - Allow selecting one university or "All Universities"
   - Replace restaurant-first analytics with university-first analytics
2. **Remove Mock Data:**
   - Remove all mock restaurant and analytics data from Super Admin views
   - Integrate fully with backend + database
3. **University Management:**
   - View all universities or a single university
   - Add new university (name + allowed email domains)
   - See restaurants and users belonging to a university
   - See basic analytics scoped to a university
4. **Backend Integration:**
   - Ensure universities are first-class entities
   - Add endpoints to fetch universities with aggregated stats
   - Fetch restaurants by university
   - Fetch user count by university

**What was implemented:**
- **Backend Enhancements:**
  - Added `findAllWithStats()` method to UniversityService - returns universities with restaurant and user counts
  - Added `findOneWithStats()` method to UniversityService - returns single university with stats
  - Updated GET /university endpoint to return stats by default
  - Updated GET /university/:id endpoint to return stats
  - Stats include: restaurantCount, userCount (aggregated from relations)
- **Frontend API Functions:**
  - Added `fetchAllUniversities()` - fetches all universities with stats (Super Admin only)
  - Added `fetchUniversityById()` - fetches single university with stats
  - Added `createUniversity()` - creates new university
  - Added `updateUniversity()` - updates university details
  - Added `toggleUniversityStatus()` - enables/disables university
  - Extended University interface to include restaurantCount and userCount
- **Super Admin Dashboard Refactor:**
  - Completely rewritten to be university-first
  - Default view shows all universities with stats
  - University selector dropdown (All Universities or specific university)
  - University statistics cards: Total Universities, Active Universities, Total Restaurants, Total Users
  - University list shows: name, allowed email domains, restaurant count, user count, created date, status
  - Enable/Disable toggle for each university
  - "Add University" form with:
    - University name input
    - Multiple email domain inputs (add/remove domains)
    - Automatic @ prefix handling
    - Validation (name required, at least one domain)
  - Removed all mock data (mockRestaurants, mock stats, mock reports)
  - All data now comes from backend API
  - Newly created universities appear immediately after creation
- **CSS Updates:**
  - Added styles for: loading, success, error messages
  - Added styles for: university details, domain inputs, form elements
  - Added styles for: status badges (active/inactive), enable/disable buttons

**Files touched:**
- `backend/src/university/university.service.ts` - Added findAllWithStats() and findOneWithStats() methods
- `backend/src/university/university.controller.ts` - Updated endpoints to use stats methods
- `lib/api.ts` - Added university management API functions (fetchAllUniversities, fetchUniversityById, createUniversity, updateUniversity, toggleUniversityStatus)
- `app/admin/dashboard/page.tsx` - Complete rewrite: university-first view, removed all mock data
- `app/admin/dashboard/admin.module.css` - Added styles for new university form and display elements
- `PROMPT_LOG.md` - Added Prompt 11 documentation

**Notes / assumptions:**
- Universities are now the primary entity in Super Admin dashboard
- All statistics are calculated from database relations (restaurantCount, userCount)
- University creation immediately refreshes the list and appears on public university selection page
- Email domains are validated to start with @ (automatically added if missing)
- Multiple email domains can be added per university
- Enable/Disable toggle updates university isActive status
- No mock data remains in Super Admin dashboard
- All authentication uses cookie-based auth (no sessionStorage for auth)
- Statistics are scoped to selected university or aggregated across all universities
- Restaurant and user counts are real-time from database
- Newly created universities are active by default
- University selection page (public) automatically shows newly created active universities

## Prompt 12 - Restaurant Creation & Admin Assignment

**What was requested:**
Allow Super Admin to edit universities and create restaurants with restaurant admin accounts:
1. **University Management:**
   - Edit existing universities (name, domains, active status)
2. **Restaurant Creation:**
   - Create restaurants with university assignment
   - Assign restaurant admin accounts (email + password)
   - Restaurant admin must belong to restaurant's university
3. **Restaurant Admin Authentication:**
   - Email domain NOT validated (any domain allowed)
   - University selection REQUIRED during login
   - If selected university ≠ admin's assigned university → reject with clear error
4. **Frontend Updates:**
   - Add Edit University functionality to Super Admin dashboard
   - Add Restaurant creation form
   - Show restaurants per university
   - Clear error messaging for login failures

**What was implemented:**
- **Prisma Schema Updates:**
  - Extended Restaurant model: added name, responsibleName, responsiblePhone, createdAt
  - Added restaurantId to User model (for restaurant admin assignment)
  - Added User relation to Restaurant model
- **Restaurant Module (Backend):**
  - RestaurantService with create, findAll, findByUniversity, findOne methods
  - RestaurantController with Super Admin only endpoints:
    - POST /restaurant - Create restaurant with admin account
    - GET /restaurant - List all restaurants
    - GET /restaurant/university/:universityId - Get restaurants by university
    - GET /restaurant/:id - Get single restaurant
  - CreateRestaurantDto with validation (name, universityId, responsibleName, responsiblePhone, adminEmail, adminPassword)
  - Restaurant creation automatically creates restaurant admin user with:
    - Role: RESTAURANT_ADMIN
    - universityId: restaurant's university
    - restaurantId: created restaurant's id
    - Password hashed with bcrypt
- **Login Validation Updates:**
  - Updated error message for university mismatch: "Account not associated with selected university"
  - University selection required for all non-SUPER_ADMIN users
  - Restaurant admins validated against selected university (no email domain check)
- **Super Admin Dashboard Enhancements:**
  - Edit University functionality:
    - Edit button on each university card
    - Edit form with name and email domains (add/remove domains)
    - Save/Cancel buttons
    - Updates persist to database
  - Restaurant Management section (shown when university selected):
    - "Add Restaurant" button
    - Restaurant creation form with:
      - Restaurant name
      - Responsible person name
      - Responsible phone number
      - Admin email (any domain allowed)
      - Admin password (min 8 characters)
    - Restaurants list showing all restaurants for selected university
    - Restaurant cards show: name, responsible person, phone, admin count, created date
  - Restaurants automatically load when university is selected
  - Restaurant count updates immediately after creation
- **API Functions:**
  - Added createRestaurant() - creates restaurant with admin
  - Added fetchAllRestaurants() - fetches all restaurants
  - Added fetchRestaurantsByUniversity() - fetches restaurants for a university
  - Extended Restaurant interface with all fields
- **Login Page Updates:**
  - Enhanced error message handling
  - Clear distinction between:
    - Wrong credentials
    - Wrong university selection
    - Missing university selection

**Files touched:**
- `backend/prisma/schema.prisma` - Extended Restaurant model, added restaurantId to User
- `backend/src/restaurant/restaurant.service.ts` - Restaurant CRUD operations and admin creation
- `backend/src/restaurant/restaurant.controller.ts` - Restaurant endpoints (Super Admin only)
- `backend/src/restaurant/restaurant.module.ts` - Restaurant module
- `backend/src/restaurant/dto/create-restaurant.dto.ts` - Restaurant creation DTO
- `backend/src/auth/auth.service.ts` - Updated error message for university mismatch
- `backend/src/app.module.ts` - Added RestaurantModule import
- `lib/api.ts` - Added restaurant management API functions
- `app/admin/dashboard/page.tsx` - Added Edit University and Restaurant creation functionality
- `app/auth/login/page.tsx` - Enhanced error message handling
- `PROMPT_LOG.md` - Added Prompt 12 documentation

**Notes / assumptions:**
- Restaurant admins can use any email domain (no domain validation)
- Restaurant admin must select correct university during login (validated server-side)
- Restaurant creation automatically creates admin account with hashed password
- Restaurant admin belongs to exactly one restaurant and one university
- Edit University form allows adding/removing email domains
- Restaurants are scoped to universities (cannot exist without university)
- Restaurant list only shows when a specific university is selected
- Created restaurants appear immediately in the list
- Restaurant count in university stats updates after restaurant creation
- All restaurant operations require SUPER_ADMIN role
- Error messages clearly distinguish between credential errors and university mismatch
- University selection is mandatory before login for all non-SUPER_ADMIN users

## Prompt 13 - Restaurant Menu & Stock Backend Integration

**What was requested:**
Integrate restaurant menu and stock management with backend and database:
1. **Data Model:**
   - Category model (belongs to restaurant)
   - Product model (belongs to category and restaurant)
   - ProductExtra model (belongs to product)
   - Stock tracking fields: hasStock, stockQuantity, stockThreshold, manuallyOutOfStock
2. **Stock Rules:**
   - Unlimited products: hasStock=false, no stock numbers, can be manually marked out of stock
   - Limited stock products: hasStock=true, uses stockQuantity + stockThreshold
   - If stockQuantity <= stockThreshold → product is OUT OF STOCK for students
   - Students NEVER see stock numbers, only "Out of Stock" status
   - Out-of-stock products visible but disabled (modal won't open)
3. **Restaurant Admin Features:**
   - Create/edit/delete categories
   - Create/edit/delete products
   - Add/edit extras (sauces/add-ons) for products
   - Configure stock mode, stock threshold, manual out-of-stock
   - All operations scoped to their restaurant only
4. **Student View:**
   - Load menu only from backend
   - Show categories, products, extras
   - Apply stock rules correctly
   - Never show stock numbers
5. **Backend Requirements:**
   - REST endpoints for categories, products, extras CRUD
   - All endpoints protected by JWT + role + restaurant ownership
   - Public endpoint for students (no stock numbers)

**What was implemented:**
- **Prisma Schema Updates:**
  - Added Category model: id, name, restaurantId, createdAt
  - Added Product model: id, name, price, description, hasStock, stockQuantity, stockThreshold, manuallyOutOfStock, categoryId, restaurantId, createdAt
  - Added ProductExtra model: id, name, price, productId
  - Added relations: Restaurant → Categories, Category → Products, Product → Extras
- **Menu Module (Backend):**
  - MenuService with full CRUD for categories and products
  - MenuController with protected endpoints (RESTAURANT_ADMIN only)
  - Public endpoint GET /menu/restaurant/:restaurantId for students
  - RestaurantOwnerGuard to enforce restaurant ownership
  - Stock calculation logic: isOutOfStock = manuallyOutOfStock OR (hasStock AND stockQuantity <= stockThreshold)
  - Public menu endpoint hides stock numbers, only returns isOutOfStock boolean
- **Restaurant Dashboard MenuTab:**
  - Completely refactored to use backend API
  - Removed all sessionStorage usage for menu data
  - Loads categories and products from backend on mount
  - Create/edit/delete categories with API calls
  - Create/edit/delete products with API calls
  - Stock management UI: trackStock checkbox, stockQuantity input, stockThreshold input
  - Manual out-of-stock toggle
  - Extras management (sauces/add-ons) integrated with ProductExtra model
  - Real-time menu updates after CRUD operations
- **Student Menu Page:**
  - Refactored to load menu from backend API (fetchPublicMenu)
  - Removed sessionStorage and mockMenu usage
  - Uses cookie-based authentication (checkAuth)
  - Transforms backend data structure to frontend format
  - Applies stock rules: only shows isOutOfStock flag (no stock numbers)
  - Out-of-stock products are visible but disabled (modal won't open)
  - Loading state and empty menu handling
- **API Functions:**
  - Added createCategory, fetchCategories, updateCategory, deleteCategory
  - Added createProduct, fetchProducts, fetchProduct, updateProduct, deleteProduct
  - Added fetchPublicMenu (for students)
  - All functions use credentials: 'include' for cookie-based auth
- **Security:**
  - RestaurantOwnerGuard ensures restaurant admins can only access their own restaurant's menu
  - All menu endpoints require JWT authentication
  - Role-based access: RESTAURANT_ADMIN for management, public for viewing
  - Restaurant ownership enforced at service level

**Files touched:**
- `backend/prisma/schema.prisma` - Added Category, Product, ProductExtra models
- `backend/src/menu/menu.service.ts` - Menu business logic with stock rules
- `backend/src/menu/menu.controller.ts` - Menu API endpoints
- `backend/src/menu/menu.module.ts` - Menu module
- `backend/src/menu/dto/` - DTOs for category and product operations
- `backend/src/common/guards/restaurant-owner.guard.ts` - Restaurant ownership guard
- `backend/src/users/users.service.ts` - Added restaurantId to user response
- `backend/src/app.module.ts` - Added MenuModule
- `lib/api.ts` - Added menu management API functions
- `app/restaurant/dashboard/page.tsx` - Refactored MenuTab to use backend
- `app/student/restaurant/[id]/page.tsx` - Refactored to load menu from backend
- `PROMPT_LOG.md` - Added Prompt 13 documentation

**Notes / assumptions:**
- Stock is NOT decremented per order (avoids race conditions)
- Stock threshold determines when product becomes out of stock
- Students never see stock numbers, only availability status
- Restaurant admins see full stock information (quantity, threshold)
- Extras (sauces/add-ons) are stored as ProductExtra model
- Menu data is fully backend-driven (no sessionStorage for menu)
- Restaurant ownership is enforced at guard and service level
- Public menu endpoint returns only necessary data for students
- Stock rules: manuallyOutOfStock OR (hasStock AND stockQuantity <= stockThreshold) = out of stock
- Categories can be deleted (cascades to products and extras)
- Products can be deleted (cascades to extras)
- All menu operations require RESTAURANT_ADMIN role
- Menu is scoped to restaurant (cannot access other restaurants' menus)

## Prompt 14 - Continue From Phase 7 and Phase 8

**What was requested:**
Continue implementation from Phase 7 and Phase 8 only (post-stabilization), with no architecture refactor:
1. **Phase 7 (Student UX):**
   - Integrate SweetAlert2 properly
   - Replace remaining `alert()` and `confirm()` usage
   - Improve busy/closed messaging
   - Add sticky horizontal category navigator on student restaurant page
   - Smooth scrolling to menu sections
2. **Phase 8 (Super Admin Dashboard):**
   - Improve dashboard clarity
   - Add order history analytics per restaurant using existing backend data
   - Show: total orders, total revenue, cancelled, completed
   - Keep backend-only data source and avoid schema changes

**What was implemented:**
- Completed mandatory architecture/state audit before coding:
  - Verified schema, app module wiring, order/report/config services, and rule enforcement from Phases 1-6.
- Implemented Phase 7:
  - Added sticky horizontal category navigation bar in student menu page.
  - Added active category tracking based on scroll position.
  - Added smooth scroll to category sections.
  - Replaced remaining native `confirm()` in restaurant dashboard product deletion flow with SweetAlert2.
  - Replaced remaining native `alert()` in verify page resend action with SweetAlert2.
  - Improved student busy/closed restaurant SweetAlert copy and fixed busy badge style usage.
- Implemented Phase 8:
  - Added frontend analytics helper to derive per-restaurant metrics from existing backend order endpoint.
  - Added super admin "Order History Snapshot" section and per-restaurant analytics cards.
  - Displayed metrics: total orders, total revenue, cancelled, completed.
  - Kept current architecture and module boundaries unchanged.
- Verified builds and validation:
  - Frontend TypeScript check passed (`npx tsc --noEmit`)
  - Frontend build passed (`npm run build`)
  - Backend build passed (`npm run build`)
  - Prisma validation passed (`npx prisma validate`)

**Files touched:**
- `app/student/restaurant/[id]/page.tsx` - Added sticky category navigator, active section tracking, smooth scrolling
- `app/student/restaurant/[id]/menu.module.css` - Added category nav and responsive sticky styles
- `app/restaurant/dashboard/page.tsx` - Replaced product delete `confirm()` with SweetAlert2 dialog
- `app/auth/verify/page.tsx` - Replaced resend `alert()` with SweetAlert2
- `app/student/home/page.tsx` - Improved busy/closed SweetAlert messaging, fixed busy badge usage
- `app/student/home/home.module.css` - Added `statusBusy` style
- `lib/api.ts` - Added `fetchRestaurantOrderAnalytics()` and related analytics types
- `app/admin/dashboard/page.tsx` - Added analytics loading/aggregation and order history metrics UI
- `app/admin/dashboard/admin.module.css` - Added analytics card/layout styles
- `PROMPT_LOG.md` - Added Prompt 14 documentation
- `PROJECT_STRUCTURE.md` - Updated to match current project structure

**Notes / assumptions:**
- No Prisma schema changes were made in this prompt.
- No backend architecture refactor was introduced.
- Phase 8 analytics are computed from existing `/order/restaurant/:restaurantId` backend data route to preserve current structure.

## Prompt 15 - Super Admin Layout Refactor & University Navigation Fix

**What was requested:**
1. Refactor Super Admin dashboard into a structured sidebar + section layout.
2. Add "Change University" navigation on login and signup pages.
3. Move restaurant open reminder to dashboard mount (not Settings tab).
4. Preserve existing APIs, guards, auth flow, and backend logic.
5. Update project documentation.

**What was implemented:**
- Refactored Super Admin dashboard UI into a two-column layout:
  - Left sidebar navigation with sections: Overview, Universities, Restaurants, Order Analytics, Escalated Reports.
  - Section-based rendering using `activeSection` local state.
- Reorganized existing Super Admin content without changing logic:
  - Overview cards and global settings under Overview.
  - University selector + university creation/list/edit under Universities.
  - Restaurant management under Restaurants.
  - Order analytics summary/per-restaurant metrics under Order Analytics.
  - Added Escalated Reports placeholder section for future implementation.
- Added "Change University" button to both auth pages:
  - Clears `sessionStorage.selectedUniversity`.
  - Redirects to `/`.
  - Placed below page title as a small secondary-styled button.
- Relocated restaurant open reminder logic:
  - Reminder now runs on restaurant dashboard mount after auth check.
  - Checks settings once and triggers SweetAlert2 info reminder when opening time has started and restaurant is still closed.
  - Added local state flag to prevent duplicate reminder triggers.
  - Removed old reminder logic from Settings tab.
- Verified frontend TypeScript compilation with `npx tsc --noEmit`.

**Files touched:**
- `app/admin/dashboard/page.tsx` - Added sidebar navigation, section-based rendering, and content reorganization.
- `app/admin/dashboard/admin.module.css` - Added dashboard layout/sidebar/main-content styles.
- `app/auth/login/page.tsx` - Added "Change University" button and behavior.
- `app/auth/signup/page.tsx` - Added "Change University" button and behavior.
- `app/restaurant/dashboard/page.tsx` - Moved open reminder to dashboard mount and removed Settings-tab reminder.
- `PROMPT_LOG.md` - Added Prompt 15 documentation.
- `PROJECT_STRUCTURE.md` - Updated documentation status note.

**Notes / assumptions:**
- No backend code, Prisma schema, routes, or API contracts were modified.
- Existing auth and dashboard data flows were preserved; this prompt is a UI/render-organization refactor plus targeted UX fixes.

## Prompt 16 - Manual Open/Close System Stabilization & Settings UX Upgrade

**What was requested:**
1. Stabilize restaurant availability rules (no auto-open, auto-close at closeTime, manual open/close support).
2. Audit existing backend availability logic before implementing.
3. Ensure restaurant settings endpoint supports `isOpen` updates.
4. Upgrade restaurant Settings tab UX with explicit Manual Availability and Working Hours sections.
5. Ensure student-side availability relies on backend state and remove schedule-based frontend calculations if present.
6. Validate frontend/backend builds and document changes.

**What was implemented:**
- **Backend audit results:**
  - `backend/src/restaurant/restaurant.service.ts` already had auto-close logic (`autoCloseIfNeeded`) and no auto-open logic.
  - `backend/src/menu/menu.service.ts` had no time-based restaurant availability logic.
- **Availability rule stabilization (backend):**
  - Kept existing auto-close behavior and made returned availability explicit in public restaurant payload:
    - If current time is past `closeTime`, returned `isOpen` is forced to `false`.
    - Otherwise returned `isOpen` follows persisted state.
  - Kept schedule behavior manual for opening (no auto-open introduced).
- **Manual open/close persistence fix (backend):**
  - Extended settings DTO and service update logic to accept and persist `isOpen`.
  - `updateSettings` now updates `isOpen`, `openTime`, `closeTime`, and `maxConcurrentOrders` without recalculating/overwriting `isOpen` afterward.
- **Manual close support via settings endpoint (backend):**
  - `PUT /restaurant/:id/settings` now accepts `isOpen: true/false` directly.
  - This allows both manual open and manual close through one endpoint.
- **Restaurant dashboard Settings UX upgrade (frontend):**
  - Reworked Settings tab into two clear cards:
    - `Manual Availability` (OPEN/CLOSED badge + large switch control).
    - `Working Hours` (open/close times + max concurrent orders).
  - Toggle now calls backend settings endpoint with `isOpen`.
  - Added SweetAlert success feedback for manual open/close and working-hours save.
  - Added request guards (`savingSettings`, `updatingAvailability`) to prevent duplicate submissions.
- **Student-side audit:**
  - Reviewed `app/student/home/page.tsx` and `app/student/restaurant/[id]/page.tsx`.
  - No schedule-based availability calculations were present; student availability remains backend-driven via `isOpen`.
- **Validation:**
  - Backend build passed (`npm run build` in `backend/`).
  - Frontend build passed (`npm run build` in project root).

**Files touched:**
- `backend/src/restaurant/dto/update-restaurant-settings.dto.ts` - Added optional `isOpen` boolean.
- `backend/src/restaurant/restaurant.service.ts` - Added `isOpen` persistence in settings update and explicit closeTime-based availability return logic.
- `app/restaurant/dashboard/page.tsx` - Upgraded Settings tab UX and switched manual availability updates to settings endpoint.
- `app/restaurant/dashboard/dashboard.module.css` - Added styling for settings cards, availability badge/switch, and submission states.
- `PROMPT_LOG.md` - Added Prompt 16 documentation.

**Notes / assumptions:**
- No Prisma schema changes were required.
- Existing auth, orders, analytics, and reports flows were preserved.
- Existing `/restaurant/:id/open` and `/restaurant/:id/close` endpoints remain available; frontend manual availability now uses `/restaurant/:id/settings` for stable persisted toggling.

## Prompt 17 - Professional Notification Counter System

**What was requested:**
1. Add Restaurant Admin notification counters for pending orders and unhandled reports.
2. Use smart polling (no WebSockets).
3. Reuse existing enums/statuses and guards.
4. Keep existing auth/order/report/availability/analytics logic stable.

**Enum audit result (no enum/schema changes):**
- `OrderStatus` values in schema: `RECEIVED`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`.
  - Notification counter uses `OrderStatus.RECEIVED` as the "awaiting restaurant action" state in current workflow.
- `ReportStatus` values in schema: `PENDING`, `RESOLVED_BY_RESTAURANT`, `CONFIRMED_BY_STUDENT`, `ESCALATED`.
  - Notification counter treats `ReportStatus.RESOLVED_BY_RESTAURANT` as the handled-by-restaurant status.
- Added inline code comments in services explaining these choices.

**What was implemented:**
- **Backend - Orders**
  - Added `countPendingOrdersForRestaurant(restaurantId)` in order service.
  - Added endpoint: `GET /order/restaurant/:restaurantId/pending-count`.
  - Route protection: `JwtAuthGuard`, `RolesGuard`, `RestaurantOwnerGuard`, role `RESTAURANT_ADMIN`.
- **Backend - Reports**
  - Added `countUnhandledReportsForRestaurant(restaurantId)` in report service.
  - Added endpoint: `GET /report/restaurant/:restaurantId/unhandled-count`.
  - Route protection: `JwtAuthGuard`, `RolesGuard`, `RestaurantOwnerGuard`, role `RESTAURANT_ADMIN`.
- **Frontend API**
  - Added `fetchPendingOrdersCount(restaurantId)`.
  - Added `fetchUnhandledReportsCount(restaurantId)`.
  - Both use `credentials: 'include'` and existing API base URL logic with error handling.
- **Restaurant Dashboard UI**
  - Added state counters:
    - `pendingOrdersCount`
    - `unhandledReportsCount`
  - Added smart polling for counts:
    - immediate fetch on restaurant load
    - `setInterval` every 15 seconds
    - refresh on `window` focus
    - cleanup on unmount
  - Added tab badges:
    - `Orders` shows red badge when `pendingOrdersCount > 0`
    - `Reports` shows red badge when `unhandledReportsCount > 0`
    - hidden when count is zero
  - Added report handling action in reports tab (`Mark Handled`) for `PENDING` reports, followed by counts refresh.
  - Wired order status updates from `RestaurantOrdersView` to refresh counters after status change.

**Files touched:**
- `backend/src/order/order.service.ts` - Added pending-order counter method.
- `backend/src/order/order.controller.ts` - Added pending-order counter route with owner guard protection.
- `backend/src/report/report.service.ts` - Added unhandled-report counter method.
- `backend/src/report/report.controller.ts` - Added unhandled-report counter route with owner guard protection.
- `lib/api.ts` - Added frontend counter API functions.
- `app/restaurant/dashboard/page.tsx` - Added counter state, smart polling, badge rendering, and report handled refresh flow.
- `app/restaurant/dashboard/dashboard.module.css` - Added badge and tab-label styles (plus report action button styling).
- `components/RestaurantOrdersView.tsx` - Added optional callback to trigger counter refresh on order status updates.
- `PROMPT_LOG.md` - Added Prompt 17 documentation.

**Validation:**
- Backend build passed (`npm run build` in `backend/`).
- Frontend build passed (`npm run build` in project root).

**Notes / assumptions:**
- No Prisma schema changes were made.
- No WebSocket logic was introduced; polling strategy is interval + focus refresh only.

## Prompt 18 - VIP Order Cancellation & Refund System

**What was requested:**
1. Extend `Order` schema with public `orderNumber`, cancellation metadata, and refund status.
2. Add secure restaurant-only cancellation endpoint with structured reason and manual refund flow.
3. Add cancellation UI flow for restaurant dashboard with SweetAlert reason modal.
4. Add student cancellation SweetAlert and reason/refund visibility.
5. Add mandatory order placement confirmation in cart.
6. Preserve availability logic, service fee logic, notification counters, and order status machine integrity.

**Schema changes (audited and applied without duplication):**
- Updated `backend/prisma/schema.prisma`:
  - Added enum `CancellationReasonType` (`OUT_OF_STOCK`, `INTERNAL_ISSUE`, `BUSY`, `OTHER`)
  - Added enum `RefundStatus` (`NONE`, `PENDING_MANUAL_REFUND`, `REFUNDED`, `NOT_REQUIRED`)
  - Extended `Order` model with:
    - `orderNumber Int @unique @default(autoincrement())`
    - `cancellationReasonType CancellationReasonType?`
    - `cancellationComment String?`
    - `cancelledAt DateTime?`
    - `cancelledByRole Role?`
    - `refundStatus RefundStatus @default(NONE)`
  - Preserved UUID primary key `id` unchanged.

**Migration:**
- Added migration folder:
  - `backend/prisma/migrations/20260217141000_add_order_cancellation_and_refund_fields/migration.sql`
- Migration actions:
  - Created `CancellationReasonType` and `RefundStatus` enums.
  - Added new cancellation/refund columns to `orders`.
  - Added `orderNumber` with sequence-backed autoincrement behavior.
  - Backfilled existing rows with unique `orderNumber`.
  - Added unique index `orders_orderNumber_key`.

**Backend changes:**
- Added DTO:
  - `backend/src/order/dto/cancel-order-by-restaurant.dto.ts`
  - Validates `reasonType` enum and requires `comment` when reason is `OTHER`.
- Updated service:
  - `backend/src/order/order.service.ts`
  - Added `cancelOrderByRestaurant(orderId, reasonType, comment?)`:
    - allows cancellation only from `RECEIVED` or `PREPARING`
    - stores reason/comment/cancel metadata
    - sets `status = CANCELLED`
    - sets `refundStatus` for `DEMO` payment using global service fee setting:
      - service fee enabled -> `PENDING_MANUAL_REFUND`
      - service fee disabled -> `NOT_REQUIRED`
  - Hardened generic status patch flow to reject direct `CANCELLED` transition and require dedicated cancel endpoint for structured tracking.
- Updated controller:
  - `backend/src/order/order.controller.ts`
  - Added `POST /order/:id/cancel`
  - Protected with `JwtAuthGuard`, `RolesGuard`, `RestaurantOwnerGuard`, role `RESTAURANT_ADMIN`.
  - Reuses ownership access check before invoking cancellation service method.

**Frontend updates:**
- Restaurant side:
  - `components/RestaurantOrdersView.tsx`
  - Added `Cancel Order` button only for `received` and `preparing` orders.
  - Added SweetAlert cancellation modal with reason dropdown and conditional textarea for `OTHER`.
  - Calls `POST /order/:id/cancel` and refreshes orders + notification counters callback.
  - Removed ready-state cancellation action and aligned status actions with backend transitions.
  - Switched displayed public reference to `orderNumber`.
- Student side:
  - `app/student/order/[id]/page.tsx`
  - Added cancellation-aware order typing (`refundStatus`, `cancellationReasonType`, `cancellationComment`, `orderNumber`).
  - Shows SweetAlert titled `Order Cancelled` with refund-status-specific text.
  - Displays cancellation reason and optional comment clearly in page content.
- Cart confirmation:
  - `app/student/cart/page.tsx`
  - Added mandatory pre-submit SweetAlert confirmation:
    - Title: `Confirm Order`
    - Text: `After placing this order, it cannot be edited or cancelled.`
  - Existing service fee and order creation payload logic preserved.

**No-duplication / safety policy confirmation:**
- Reused existing `Role` and `OrderStatus` enums; no duplicate fields/enums introduced.
- UUID `Order.id` remains primary key.
- Availability logic untouched.
- Service fee computation at order creation untouched.
- Notification counter flow preserved and refreshed after cancellation.

## Prompt 19 - Payment Method Backend Foundation

**What was requested:**
1. Replace `PaymentMethod` enum from `DEMO` to `CARD | COUNTER`.
2. Extend `Order` with secure card metadata (`cardLast4` only).
3. Extend `CreateOrderDto` with payment + card inputs and strict validation.
4. Update order creation logic to persist only `cardLast4`, never full card data.
5. Keep cancellation, notification counters, and service fee logic stable.
6. Add migration mapping existing DB payment value `DEMO -> COUNTER`.
7. Backend-only phase (no frontend UI changes).

**What was implemented:**
- **Schema updates (`backend/prisma/schema.prisma`):**
  - `PaymentMethod` changed to:
    - `CARD`
    - `COUNTER`
  - `Order.paymentMethod` default changed from `DEMO` to `COUNTER`.
  - Added `Order.cardLast4 String?`.
  - UUID `Order.id` remained the primary key unchanged.

- **Migration (`backend/prisma/migrations/20260217152000_payment_method_backend_foundation/migration.sql`):**
  - Added nullable `cardLast4` column.
  - Replaced enum type using `PaymentMethod_new`.
  - Safely remapped existing rows:
    - `DEMO -> COUNTER`
  - Swapped enum types and restored default `paymentMethod = COUNTER`.

- **DTO updates (`backend/src/order/dto/create-order.dto.ts`):**
  - Added required `paymentMethod: PaymentMethod`.
  - Added optional card input fields:
    - `cardNumber`
    - `cardHolderName`
    - `expiryMonth`
    - `expiryYear`
    - `cvv`
  - Added CARD-specific validation rules:
    - `cardNumber`: required for CARD, sanitized (dashes/spaces removed), exactly 16 digits.
    - `cardHolderName`: required for CARD, letters and spaces only.
    - `expiryMonth`: required for CARD, integer 1..12.
    - `expiryYear`: required for CARD, integer >= current year.
    - Cross-field expiry validation: if current year, month must be current month or later.
    - `cvv`: required for CARD, exactly 3 digits.
  - For `COUNTER`, card fields are ignored by validation (`ValidateIf` guards).

- **Order service updates (`backend/src/order/order.service.ts`):**
  - In `create(...)`:
    - Reads `paymentMethod` from DTO.
    - Runs explicit server-side CARD validation and sanitization.
    - Persists only `cardLast4` (`sanitizedCardNumber.slice(-4)`) for CARD.
    - Persists `cardLast4 = null` for COUNTER.
    - Does **not** store full card number, CVV, expiry month/year, or holder name.
    - Service fee computation logic remains unchanged.
  - Cancellation flow:
    - Removed dependency on `PaymentMethod.DEMO`.
    - Uses current enum values:
      - `CARD` -> `PENDING_MANUAL_REFUND`
      - `COUNTER` -> `NOT_REQUIRED`
    - Existing cancellation stage checks and status machine remained intact.

**Security notes:**
- No full card number persistence.
- No CVV persistence.
- No expiry persistence.
- No added logging of payment card fields.
- Stored payment metadata is limited to `paymentMethod` and `cardLast4`.

**Validation / build results:**
- Prisma schema validation passed (`npx prisma validate`).
- Prisma client generation passed (`npx prisma generate`).
- Migration deployment passed (`npx prisma migrate deploy`).
- Migration status confirmed up-to-date (`npx prisma migrate status`).
- Backend build passed (`npm run build` in `backend/`).

**No frontend changes in this phase:**
- Confirmed. This prompt modified backend schema, migration, DTO, and service logic only.

## Prompt 20 - Professional Frontend Payment System

**What was requested:**
- Upgrade cart checkout UX with professional payment selection and card form.
- Add real-world frontend card validation with inline errors.
- Keep existing service fee logic and order confirmation SweetAlert unchanged.
- Send secure checkout payload compatible with backend `PaymentMethod` + CARD fields.
- Do not store card data in session storage and do not log sensitive values.

**Audit confirmations before coding:**
- `PaymentMethod` enum is `CARD | COUNTER` in schema.
- Backend create-order DTO expects `paymentMethod` and conditional card fields.
- Backend order service already stores only `cardLast4` and preserves service-fee logic.
- Existing checkout confirmation SweetAlert already exists in cart and was preserved.

**What was implemented:**
- Updated `app/student/cart/page.tsx`:
  - Added controlled payment method selection:
    - `CARD`
    - `COUNTER` (default)
  - Added conditional card form rendered only for `CARD` with fields:
    - Card Number
    - Card Holder Name
    - Expiry Month
    - Expiry Year
    - CVV
  - Added frontend validation helpers (single shared validation flow, no duplicate blocks):
    - Card number formatting `1234-5678-9012-3456`
    - Internal sanitization to digits-only for validation and payload
    - Exact 16-digit card number requirement
    - Card holder letters/spaces only, min length 3
    - Expiry month dropdown `01..12`
    - Expiry year dropdown `currentYear..currentYear+10`
    - Expiry not-in-past cross-check
    - CVV exactly 3 digits
  - Added inline error rendering for field-level validation (no SweetAlert for field errors).
  - Disabled checkout when `CARD` is selected and card validation fails.
  - Preserved existing SweetAlert behavior for:
    - final confirmation
    - success
    - backend/server errors
  - Extended checkout payload securely:
    - always sends `paymentMethod`
    - sends sanitized card fields only when `paymentMethod === CARD`
  - Added secure UX note under card form:
    - `🔒 Your card details are encrypted and never stored.`

- Updated `app/student/cart/cart.module.css`:
  - Added professional payment/card form styles:
    - `.paymentSection`
    - `.paymentOption`
    - `.cardForm`
    - `.inputGroup`
    - `.inputError`
    - `.row`
    - `.secureNote`
  - Added disabled checkout button styling and responsive row behavior.

**Security notes:**
- No card data persisted to `sessionStorage`.
- No logging of card number/CVV was introduced.
- Card number is sanitized before request payload and never stored outside component state.

**Preservation checks:**
- Service fee calculation logic remained unchanged.
- Existing cart item/session flow remained unchanged.
- Existing redirect-after-success behavior remained unchanged.
- Existing confirmation SweetAlert text/flow remained intact.

**Validation / build results:**
- Frontend type-check passed: `npx tsc --noEmit`
- Frontend build passed: `npm run build` (root)
- Backend build passed: `npm run build` (backend)

## Prompt 21 — Operational Clarity & Platform Revenue Engine

**What was requested:**
- Add POS order mapping support (`posOrderNumber`) for restaurant admins in backend + restaurant dashboard.
- Add service-fee accounting analytics for Super Admin with strict counting rules by payment method.
- Keep order creation, service-fee calculation, refund, cancellation, and payment validation logic unchanged.
- Run mandatory validation commands and document the implementation.

**What was implemented:**
- **Order POS mapping (backend):**
  - Added nullable field `posOrderNumber String?` to `Order` in Prisma schema.
  - Added DTO `UpdateOrderPosDto` with:
    - optional string input
    - trim transform
    - max length 50
  - Added endpoint `PATCH /order/:id/pos`:
    - guards: `JwtAuthGuard`, `RolesGuard`, `RestaurantOwnerGuard`
    - role: `RESTAURANT_ADMIN`
  - Added secure service method to update POS reference only for the owning restaurant admin.

- **Order POS mapping (restaurant dashboard):**
  - Updated order cards to show:
    - `UniBite Order #: <orderNumber>`
    - `POS Reference (optional)` input
  - Added per-order `Save` button for POS reference.
  - Added saving state with disabled button while request is in progress.
  - Added SweetAlert success/error feedback.
  - Added persistent highlighted reminder banner at top of Orders tab:
    - `To avoid confusion during pickup, please write the UniBite order number on the printed receipt or record your POS reference here.`

- **Service Fee Accounting Engine (backend):**
  - Added `getServiceFeeAnalytics()` in `OrderService`.
  - Added endpoint `GET /order/service-fee-analytics` (role: `SUPER_ADMIN`).
  - Aggregation returns per restaurant:
    - `totalServiceFeeLifetime`
    - `totalServiceFeeCurrentMonth`
    - `totalCardFees`
    - `totalCounterFeesDelivered`
    - `contributingOrdersCount`
  - Rule logic implemented exactly:
    - `CARD` orders always contribute (counted immediately).
    - `COUNTER` orders contribute only when `status === DELIVERED`.
  - Date window for current month:
    - first day of current month through now.
  - If `serviceFeeEnabled === false`, response indicates disabled state for UI messaging.

- **Service Fee Accounting (Super Admin dashboard):**
  - Added dedicated sidebar section: `Service Fee Accounting`.
  - Added UI cards per restaurant showing only platform fee metrics (no food revenue).
  - Added disabled-state banner:
    - `Service fee is currently disabled. No platform revenue is being collected.`

**Files touched:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260217170000_add_pos_order_number/migration.sql`
- `backend/src/order/dto/update-order-pos.dto.ts`
- `backend/src/order/order.controller.ts`
- `backend/src/order/order.service.ts`
- `components/RestaurantOrdersView.tsx`
- `app/restaurant/dashboard/dashboard.module.css`
- `lib/api.ts`
- `app/admin/dashboard/page.tsx`
- `app/admin/dashboard/admin.module.css`
- `PROMPT_LOG.md`
- `PROJECT_STRUCTURE.md`

**Validation / command results:**
- `npx prisma migrate dev --name add_pos_order_number`:
  - blocked by Prisma in this environment (`non-interactive` shell restriction for `migrate dev`).
- Equivalent migration creation and apply completed via:
  - manual migration SQL file generation
  - `npx prisma migrate deploy` (passed, migration applied)
- `npx prisma generate` passed.
- `npx prisma validate` passed.
- `npm run build` (backend) passed.
- `npx tsc --noEmit` passed.
- `npm run build` (frontend) passed.

## Prompt 22 - Order State Machine & Controlled Cancellation Refactor

**Business reasoning:**
- Split physical handover from student confirmation to model real COUNTER pickup behavior.
- Prevent invalid restaurant cancellation after handover and after completion.
- Ensure cancelled CARD orders clearly communicate manual refund pickup to students.
- Keep service-fee behavior controlled by the Super Admin toggle, while changing COUNTER fee recognition to final completion.

**Schema changes:**
- Updated `OrderStatus` to:
  - `RECEIVED`
  - `PREPARING`
  - `READY`
  - `DELIVERED_TO_STUDENT`
  - `COMPLETED`
  - `CANCELLED`
- Added `SYSTEM_TIMEOUT` to `CancellationReasonType`.
- Added nullable `Order` timestamps:
  - `readyAt`
  - `deliveredAt`
  - `completedAt`

**Cancellation boundary enforcement:**
- Restaurant cancellation allowed in:
  - `RECEIVED`
  - `PREPARING`
- In `READY`, only `INTERNAL_ISSUE` is accepted.
- Restaurant cancellation blocked in:
  - `DELIVERED_TO_STUDENT`
  - `COMPLETED`
- `SYSTEM_TIMEOUT` reason is reserved for internal automatic cancellation and rejected from restaurant cancel requests.
- Added internal timeout sweep for `COUNTER + READY + readyAt older than 3 hours`:
  - status -> `CANCELLED`
  - `cancellationReasonType` -> `SYSTEM_TIMEOUT`
  - `refundStatus` -> `NOT_REQUIRED`
  - `cancelledByRole` kept `null` (no new role introduced)

**Order lifecycle/refund logic updates:**
- `PREPARING -> READY` sets `readyAt`.
- `READY -> DELIVERED_TO_STUDENT` (restaurant handover) sets `deliveredAt`.
- `DELIVERED_TO_STUDENT -> COMPLETED` (student confirmation) sets `completedAt`.
- Student confirmation is owner-only and only valid from `DELIVERED_TO_STUDENT`.
- New order blocking for students now applies only when an existing `COUNTER` order is in `DELIVERED_TO_STUDENT`:
  - error: `Previous order must be confirmed before placing a new one.`
- Cancelled `CARD` orders continue to set `refundStatus = PENDING_MANUAL_REFUND`.
- Service-fee analytics now count `COUNTER` fees only when order status is `COMPLETED` (service-fee toggle behavior preserved).

**Frontend adjustments (minimal):**
- Replaced `DELIVERED` usage with `DELIVERED_TO_STUDENT` and added `COMPLETED` handling.
- Restaurant orders view now supports:
  - handover action from `READY` to `DELIVERED_TO_STUDENT`
  - READY-state cancel modal constrained to `INTERNAL_ISSUE`
- Student order page now:
  - shows `Mark as Completed` only in `DELIVERED_TO_STUDENT`
  - sends status update to `COMPLETED`
  - shows refund instruction text only for cancelled `CARD` orders, including amount paid and cancellation reason context.

**Files touched:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260218120000_order_state_machine_controlled_cancellation/migration.sql`
- `backend/src/order/order.service.ts`
- `components/RestaurantOrdersView.tsx`
- `app/student/order/[id]/page.tsx`
- `app/restaurant/dashboard/dashboard.module.css`
- `lib/api.ts`
- `app/admin/dashboard/page.tsx`
- `PROMPT_LOG.md`

**Migration notes:**
- Added new migration only (no edits to previous migrations).
- Migration performs:
  - `OrderStatus` enum rename `DELIVERED -> DELIVERED_TO_STUDENT`
  - `OrderStatus` enum add `COMPLETED`
  - `CancellationReasonType` enum add `SYSTEM_TIMEOUT`
  - `orders` table add nullable `readyAt`, `deliveredAt`, `completedAt`.

**Validation / build results:**
- `npx prisma validate` passed.
- `npx prisma generate` passed.
- `npm run build` (backend) passed.
- `npx tsc --noEmit` passed.
- `npm run build` (frontend) passed.

## Prompt 23 - Restaurant Operational Sync & Dashboard Refactor

**Audit findings:**
- `backend/src/restaurant/restaurant.service.ts` was recomputing `isOpen` during public fetch and could override persisted manual state in the response path.
- Auto-close was tied to student list fetch timing, which created stale/lagging behavior between restaurant and student views.
- Student home (`app/student/home/page.tsx`) loaded restaurants only once on mount, so browser tab switches/focus could keep stale availability state.
- Restaurant orders UI (`components/RestaurantOrdersView.tsx`) mixed incoming/history logic, included `READY` inside incoming queue, and had no backend search filter.

**Fixes applied:**
- **Restaurant availability sync**
  - Kept `isOpen` as persisted DB source of truth.
  - Removed response-time `isOpen` recomputation in public list path.
  - Added explicit auto-close check based on `openTime/closeTime` window logic (including overnight windows).
  - Added university-active and maintenance guard effects in availability flow.
  - Added enforcement on open actions (`openRestaurant` and `updateSettings` with `isOpen=true`) for:
    - `isDisabled`
    - inactive university
    - maintenance mode
    - required opening/closing times
  - `getSettings` now applies auto-close check before returning values.

- **Student sync refresh**
  - `app/student/home/page.tsx` now reloads restaurants on:
    - interval (15s)
    - window focus
    - visibility change to visible
  - This keeps student availability aligned with backend changes without tab-refresh gaps.

- **Restaurant dashboard order workflow refactor**
  - Reworked `components/RestaurantOrdersView.tsx` into two sub-tabs:
    - `Incoming Orders`: `RECEIVED`, `PREPARING`
    - `Today's Orders` (last 24h): `READY`, `DELIVERED_TO_STUDENT`, `COMPLETED`, `CANCELLED`
  - Counters:
    - Incoming count = `RECEIVED + PREPARING`
    - Today count = `READY + DELIVERED_TO_STUDENT + COMPLETED` (within 24h)
  - Added debounced search inputs (350ms) for both tabs.
  - Added server-side filtering support through order query params (no full-dataset client filtering).
  - Kept UUID internal; UI continues using `orderNumber` and optional `posOrderNumber`.
  - Restricted order action controls to restaurant owner context (super admin remains read-only in this view).

- **Backend order query filtering**
  - Extended `GET /order/restaurant/:restaurantId` with:
    - `statuses` (comma-separated)
    - `search`
    - `sinceHours`
  - Search matches:
    - numeric `orderNumber`
    - `posOrderNumber` partial (case-insensitive)
  - Updated pending-count logic to include both `RECEIVED` and `PREPARING`.

- **Reminder behavior**
  - `app/restaurant/dashboard/page.tsx` reminder window now uses open/close-time-aware logic to avoid incorrect reminders outside active window, including overnight schedules.

**Files touched:**
- `backend/src/restaurant/restaurant.module.ts`
- `backend/src/restaurant/restaurant.service.ts`
- `backend/src/restaurant/restaurant.service.spec.ts`
- `backend/src/order/order.controller.ts`
- `backend/src/order/order.service.ts`
- `app/student/home/page.tsx`
- `components/RestaurantOrdersView.tsx`
- `app/restaurant/dashboard/dashboard.module.css`
- `app/restaurant/dashboard/page.tsx`
- `PROMPT_LOG.md`

**Time logic notes:**
- Auto-close now evaluates against operational window semantics rather than only a simple `now >= closeTime` same-day check.
- Overnight schedule behavior is handled for windows like `20:00 -> 02:00`.
- Reminder logic is notification-only and does not auto-open restaurants.

**Validation / build results:**
- `npm run build` (backend): passed
- `npx tsc --noEmit`: passed
- `npm run build` (frontend): passed

## Prompt 24 - UX Completion & Global Navigation Polish

**Scope guardrails respected:**
- No Prisma schema changes.
- No order state machine changes.
- No cancellation/revenue/refund logic changes.
- UX and navigation layer only, plus minimal report listing endpoint for student tracking.

**Audit summary before implementation:**
- Root `loading.tsx` was missing, so route transitions had no branded global loading experience.
- Restaurant dashboard reminder existed as one-time `SweetAlert`, not persistent/sticky.
- Student layout had no global pending-confirmation UX reminder and no quick active-order shortcut.
- Student did not have a consolidated `My Orders`/`Reports` page.
- Existing order endpoint `GET /order/student` already covered student order history needs.
- Existing report APIs lacked a student-owned listing endpoint; added minimal `GET /report/student`.

**Implemented UX changes:**

- **Global route loading overlay**
  - Added `app/loading.tsx` + `app/loading.module.css`.
  - Full-screen branded loader with centered spinner and fade-in animation (~360ms).
  - No artificial delay introduced.

- **Admin persistent opening-time reminder**
  - Replaced modal reminder with persistent sticky banner in `app/restaurant/dashboard/page.tsx`.
  - Banner condition now checks:
    - opening time passed
    - `isOpen = false`
    - restaurant not disabled
    - university active
    - maintenance mode disabled
  - Banner remains visible across all dashboard tabs until restaurant is opened.
  - Added supporting style in `app/restaurant/dashboard/dashboard.module.css`.

- **Student persistent confirmation reminder**
  - Updated `app/student/layout.tsx` to poll student orders and derive:
    - pending confirmation (`COUNTER + DELIVERED_TO_STUDENT`)
    - latest active order shortcut
  - Added sticky banner across student pages:
    - “You have an order pending confirmation…”
  - Banner disappears automatically when order becomes `COMPLETED` or `CANCELLED`.

- **Active order quick access**
  - Added shared student quick actions bar (in `app/student/layout.tsx`):
    - `My Orders`
    - `My Active Order` (shown only when active order exists)
  - Reuses existing `/student/order/[id]` tracking page.

- **Student My Orders page**
  - Added `app/student/orders/page.tsx` + `app/student/orders/orders.module.css`.
  - Tabs:
    - `Active Orders`: `RECEIVED`, `PREPARING`, `READY`, `DELIVERED_TO_STUDENT`
    - `Past Orders`: `COMPLETED`, `CANCELLED`
    - `Reports`
  - Orders default-filtered to last 30 days.
  - Displays: `orderNumber`, restaurant name, status, total, payment method, createdAt, details button.
  - Reused existing `GET /order/student`.

- **Student report tracking**
  - Added minimal backend endpoint:
    - `GET /report/student`
  - Added service query with student ownership scope + restaurant relation fields.
  - Reports tab displays:
    - report type
    - related restaurant
    - status (`PENDING`, `RESOLVED_BY_RESTAURANT`, `CONFIRMED_BY_STUDENT`, `ESCALATED`)
    - createdAt / updatedAt

**Backend support change (minimal):**
- Extended restaurant settings payload (no schema change) in `backend/src/restaurant/restaurant.service.ts`:
  - `isDisabled`
  - `isUniversityActive`
  - used by persistent admin banner logic.

**Files touched:**
- `app/loading.tsx`
- `app/loading.module.css`
- `app/restaurant/dashboard/page.tsx`
- `app/restaurant/dashboard/dashboard.module.css`
- `app/student/layout.tsx`
- `app/student/layout.module.css`
- `app/student/orders/page.tsx`
- `app/student/orders/orders.module.css`
- `backend/src/report/report.controller.ts`
- `backend/src/report/report.service.ts`
- `backend/src/restaurant/restaurant.service.ts`
- `PROMPT_LOG.md`

**Validation / build results:**
- `npm run build` (frontend): passed
- `npx tsc --noEmit`: passed
- `npm run build` (backend): passed

## Prompt 25 - Role-Based Sidebar & Account System

**Audit findings (before implementation):**
- `backend/prisma/schema.prisma` `User` model did not contain `name`, `phone`, or `language`.
- No existing profile endpoint or change-password endpoint existed (`users` controller was missing).
- Auth flow existed and was retained (`/auth/signup`, `/auth/login`, `/auth/me`, cookie-based JWT).
- Existing role UI structure:
  - Student had `app/student/layout.tsx`.
  - Restaurant and super admin had dashboard pages but no dedicated role layouts.
- Existing order state machine and financial logic were not modified.

**Schema changes:**
- Added to `User` model:
  - `name String?`
  - `phone String?`
  - `language String @default("en")`
- Added migration:
  - `backend/prisma/migrations/20260219190000_add_user_profile_fields/migration.sql`

**Backend profile/account system changes:**
- Added role-aware profile endpoints:
  - `GET /users/me/profile`
  - `PUT /users/me/profile`
  - `PATCH /users/me/language`
- Added secure password-change endpoint:
  - `POST /auth/change-password`
  - validates current password and hashes new password via existing auth service.
- Extended user/auth payloads to include profile language fields and support personalization.
- Added role-aware profile analytics:
  - Student: most ordered restaurant.
  - Restaurant admin: most sold item, orders today, total orders.

**Frontend structure and navigation changes:**
- Added reusable role shell + sidebar components with:
  - Desktop always-visible left sidebar.
  - Mobile collapsible drawer with overlay animation.
  - Role-based links for student, restaurant admin, and super admin.
- Added role layouts:
  - `app/admin/layout.tsx`
  - `app/restaurant/layout.tsx`
  - student layout upgraded to render in the same shell.
- Added pages:
  - `/profile`
  - `/settings`
  - `/settings/change-password`
  - `/about`
- Added greeting personalization (example format: `Hello, Ahmed 👋`).
- Added disabled Google button (UI only) on login/signup with tooltip `Coming Soon`.

**i18n and localization scaffolding:**
- Added locale files:
  - `locales/en.json`
  - `locales/ar.json`
- Added i18n helpers:
  - `lib/i18n.ts`
  - `lib/language.ts`
- Added language toggle in settings page.
- Language is persisted in DB (`user.language`) and applied to document `lang`/`dir` for RTL/LTR.

**Files touched (this prompt):**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260219190000_add_user_profile_fields/migration.sql`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/signup.dto.ts`
- `backend/src/auth/dto/change-password.dto.ts`
- `backend/src/users/users.module.ts`
- `backend/src/users/users.controller.ts`
- `backend/src/users/users.service.ts`
- `backend/src/users/dto/create-user.dto.ts`
- `backend/src/users/dto/update-profile.dto.ts`
- `backend/src/users/dto/update-language.dto.ts`
- `backend/src/restaurant/restaurant.service.ts`
- `lib/api.ts`
- `lib/auth.ts`
- `lib/i18n.ts`
- `lib/language.ts`
- `locales/en.json`
- `locales/ar.json`
- `components/RoleShell.tsx`
- `components/RoleSidebar.tsx`
- `components/ProtectedRolePage.tsx`
- `components/role-shell.module.css`
- `components/role-sidebar.module.css`
- `app/student/layout.tsx`
- `app/student/home/page.tsx`
- `app/student/home/home.module.css`
- `app/student/orders/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/dashboard/page.tsx`
- `app/restaurant/layout.tsx`
- `app/restaurant/dashboard/page.tsx`
- `app/profile/page.tsx`
- `app/profile/profile.module.css`
- `app/settings/page.tsx`
- `app/settings/settings.module.css`
- `app/settings/change-password/page.tsx`
- `app/settings/change-password/change-password.module.css`
- `app/about/page.tsx`
- `app/about/about.module.css`
- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `app/auth/login/auth.module.css`
- `components/RestaurantOrdersView.tsx`
- `PROMPT_LOG.md`

**Validation / build results:**
- `npm run build` (frontend): passed
- `npm run build` (backend): passed
- `npx prisma validate` (backend): passed
- `npx tsc --noEmit`: passed

## Prompt 26 - Layout Refinement & Stable i18n

**Audit findings:**
- `components/RoleShell.tsx` always rendered `RoleSidebar` for all roles.
- `app/admin/dashboard/page.tsx` also rendered its own internal sidebar panel, causing duplicate sidebars for super admin.
- Sidebar visual style was dark (`components/role-sidebar.module.css`) and not collapsible on desktop.
- i18n state was fragmented (event-based, per-page usage), with no shared language provider for student/restaurant shells.
- `fetchMyProfile` was exported from `lib/api.ts`, but profile/settings relied on the large shared API module; imports were hardened by moving profile functions to a focused module.

**What was implemented:**
- **Collapsible icon-first sidebar (student + restaurant + protected pages):**
  - Reworked `components/RoleSidebar.tsx` and `components/role-sidebar.module.css` into:
    - default collapsed width (~72px),
    - expandable width (~240px),
    - icon-always-visible nav,
    - text shown on expand,
    - smooth width/label transitions,
    - light theme (white surface, subtle border/shadow),
    - top toggle button with badge.
- **Badge logic on sidebar toggle:**
  - Student badge: counts `DELIVERED_TO_STUDENT` orders from `/order/student`.
  - Restaurant badge: uses pending count endpoint (received + preparing) via `fetchPendingOrdersCount`.
  - Poll/focus/visibility refresh added for live updates.
- **Super admin duplicate sidebar cleanup:**
  - `app/admin/layout.tsx` no longer wraps with `RoleShell`.
  - Dashboard now uses only its own internal white structured sidebar panel (no black outer duplication).
  - Super admin language is forced to English in this layout (`applyLanguageToDocument('en')`).
- **Global i18n stabilization:**
  - Added `components/LanguageProvider.tsx` with shared context (`locale`, `messages`, `setLanguage`) and document-level `lang/dir` sync.
  - Wrapped student and restaurant layouts with `LanguageProvider`.
  - Updated `components/ProtectedRolePage.tsx` to use `LanguageProvider` as shell-level source for settings/profile/about flows.
  - Updated student/restaurant shell-related views to consume shared messages.
- **RTL behavior:**
  - `lang/dir` now updated globally by provider.
  - Sidebar styles switched to logical properties (`border-inline-end`, inline badges/text alignment), so layout flips correctly in RTL.
  - Shell inherits direction (`components/role-shell.module.css`).
- **Profile import/export stabilization (`fetchMyProfile is not a function`):**
  - Added focused module `lib/profile-api.ts` with named exports:
    - `fetchMyProfile`
    - `updateMyProfile`
    - `updateMyLanguage`
  - Updated profile/settings pages to import from this module, reducing risk of runtime mismatch from large-module loading.
- **String internationalization pass (student + restaurant requested surfaces):**
  - Student:
    - `app/student/layout.tsx` (banners/quick actions)
    - `app/student/home/page.tsx`
    - `app/student/orders/page.tsx`
    - `app/student/order/[id]/page.tsx`
    - `app/profile/page.tsx`
    - `app/settings/page.tsx`
    - `app/settings/change-password/page.tsx`
  - Restaurant:
    - `app/restaurant/dashboard/page.tsx` (tabs/reports/settings/banner)
    - `components/RestaurantOrdersView.tsx` (orders/reminder/actions/search/alerts)
  - Expanded locale dictionaries:
    - `locales/en.json`
    - `locales/ar.json`

**Files touched:**
- `components/LanguageProvider.tsx`
- `components/RoleSidebar.tsx`
- `components/role-sidebar.module.css`
- `components/role-shell.module.css`
- `components/ProtectedRolePage.tsx`
- `app/student/layout.tsx`
- `app/restaurant/layout.tsx`
- `app/admin/layout.tsx`
- `app/settings/page.tsx`
- `app/profile/page.tsx`
- `app/settings/change-password/page.tsx`
- `app/student/home/page.tsx`
- `app/student/orders/page.tsx`
- `app/student/order/[id]/page.tsx`
- `app/restaurant/dashboard/page.tsx`
- `components/RestaurantOrdersView.tsx`
- `lib/profile-api.ts`
- `locales/en.json`
- `locales/ar.json`
- `PROMPT_LOG.md`

**Validation / build results:**
- `npm run build` (frontend): passed
- `npm run build` (backend): passed
- `npx tsc --noEmit`: passed

## Prompt 27 - Governance Engine Completion & Full Localization

**Audit findings (before coding):**
- Report lifecycle primitives already existed (`PENDING`, `RESOLVED_BY_RESTAURANT`, `CONFIRMED_BY_STUDENT`, `ESCALATED`) with resolve/confirm handlers, but student confirm UI was missing.
- Escalation logic was lazy-triggered on read paths and incorrectly escalated stale `PENDING` reports, not only stale `RESOLVED_BY_RESTAURANT` reports.
- No dedicated scheduler existed in report module; only order module had a safe interval pattern.
- Three-strike auto-disable existed, but needed safer status updates, super-admin visibility, and super-admin-only re-enable flow.
- Super admin reports section was placeholder text only.
- i18n was partially wired, but major student/restaurant screens still had hardcoded strings; Arabic dictionary values were effectively English.
- Route loading existed but lacked top progress indication and icon-only compact loader treatment.

**Governance implementation details:**
- Report controller now supports both singular/plural route prefixes via `@Controller(['report', 'reports'])`.
- Added plural endpoint compatibility:
  - `PATCH /reports/:id/confirm` (kept existing `PUT` compatibility)
  - `GET /reports/escalated` (kept existing `GET /report/admin` compatibility)
- Report escalation converted to scheduler-based sweep in `ReportService`:
  - `OnModuleInit` + `setInterval` (60s) + `OnModuleDestroy` cleanup
  - Escalates only `RESOLVED_BY_RESTAURANT` reports older than 24h to `ESCALATED`
  - Removed lazy read-time escalation dependency
- Unhandled report count now reflects actionable queue (`PENDING`, `ESCALATED`) instead of counting finalized states.

**Auto-disable algorithm (3-student rule):**
- Rule remains centralized in existing report creation flow (`checkThreeStrikeRule`) to avoid duplicate disable paths.
- Trigger condition: same restaurant + same report type + last 2 hours + at least 3 unique student IDs.
- On trigger:
  - Disables restaurant (`isDisabled=true`, `isOpen=false`, `disabledAt=now`) only if not already disabled.
  - Escalates matching recent reports only from actionable states (`PENDING`, `RESOLVED_BY_RESTAURANT`) to avoid overriding student-confirmed outcomes.
  - Writes system log via backend `Logger.warn`.
- Added super-admin governance APIs in restaurant module:
  - `GET /restaurant/auto-disabled` (derived auto-disable evidence + reason message)
  - `PATCH /restaurant/:id/re-enable` (SUPER_ADMIN only)

**Super-admin governance dashboard updates:**
- Implemented real “Escalated Reports” section (newest-first feed, explicit escalated badge).
- Implemented “Auto Disabled Restaurants” section with reason, trigger type, unique-student count, disabled timestamp.
- Added `Re-enable Restaurant` action button (SUPER_ADMIN only path).
- Added polling refresh while reports section is active.

**Student + restaurant report workflow UX updates:**
- Student reports tab now shows `Confirm Resolved` button when report status is `RESOLVED_BY_RESTAURANT`.
- Confirm action uses new plural API helper and updates status to `CONFIRMED_BY_STUDENT`.
- Restaurant dashboard now polls report feed and surfaces escalated-report alert banner for notification visibility.

**Global i18n binding + Arabic content updates:**
- Replaced hardcoded strings in major student/restaurant surfaces:
  - `app/student/cart/page.tsx`
  - `app/student/restaurant/[id]/page.tsx`
  - report actions in `app/student/orders/page.tsx`
  - menu/report strings in `app/restaurant/dashboard/page.tsx`
- Added comprehensive new keys to `locales/en.json`.
- Replaced `locales/ar.json` with translated Arabic values across sidebar/common/student/restaurant/status/payment/refund and newly introduced governance/cart/menu keys.
- Kept document-level RTL/LTR propagation via existing `LanguageProvider`, and fixed logical-direction CSS hotspots (inline-end positioning, start alignment, toggle direction in RTL).

**Loading UX updates:**
- Upgraded global `app/loading.tsx` + `app/loading.module.css` to hybrid loading:
  - subtle global blur overlay
  - top animated progress bar
  - compact icon-only UniBite mark + spinner
  - fade-in and motion-reduced fallback
- No artificial delay; suspense-driven only.

**Files touched:**
- `backend/src/report/report.service.ts`
- `backend/src/report/report.controller.ts`
- `backend/src/restaurant/restaurant.service.ts`
- `backend/src/restaurant/restaurant.controller.ts`
- `lib/api.ts`
- `app/admin/dashboard/page.tsx`
- `app/restaurant/dashboard/page.tsx`
- `app/restaurant/dashboard/dashboard.module.css`
- `components/RestaurantOrdersView.tsx`
- `app/student/orders/page.tsx`
- `app/student/orders/orders.module.css`
- `app/student/cart/page.tsx`
- `app/student/restaurant/[id]/page.tsx`
- `app/student/restaurant/[id]/menu.module.css`
- `app/student/home/home.module.css`
- `app/student/layout.tsx`
- `app/restaurant/layout.tsx`
- `app/loading.tsx`
- `app/loading.module.css`
- `locales/en.json`
- `locales/ar.json`
- `PROMPT_LOG.md`

**Validation / build results:**
- `npm run build` (frontend): passed
- `npm run build` (backend): passed
- `npx prisma validate`: passed
- `npx tsc --noEmit`: passed

## Prompt 27 – Minimal Branding Finalization

**What was requested:**
- Integrate final branding assets with minimal frontend-only changes.
- Configure browser tab metadata/icons without duplicate favicon wiring.
- Add clean logo placement in login/signup, sidebar, loading screen, and product placeholders.
- Update `PROMPT_LOG.md` and `PROJECT_STRUCTURE.md`.

**Audit findings (before edits):**
- `public/` only had legacy `icon-192.png`, `icon-512.png`, and `manifest.json`.
- `app/layout.tsx` metadata used old title/description and had manual `<head>` manifest/theme entries.
- Login/signup did not render brand logo.
- Sidebar brand used a text/letter mark, not logo assets.
- Loading screen used a letter mark, not the icon asset.
- Product placeholders used plain `IMG` text.
- No duplicate favicon `<link rel="icon">` tags were found in app/components.

**Assets integrated in `public/` (root only):**
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/apple-touch-icon.png`
- `public/logo-full.svg`
- `public/logo-icon.svg`

**Legacy root assets removed to avoid duplicates:**
- `public/icon-192.png`
- `public/icon-512.png`
- `public/manifest.json`

**Favicon + metadata configuration:**
- Updated `app/layout.tsx` metadata to:
  - `title: "UniBite"`
  - `description: "Taste the Campus Vibe"`
  - `icons.icon` (`/favicon-16x16.png`, `/favicon-32x32.png`)
  - `icons.apple` (`/apple-touch-icon.png`)
- Removed manual `<head>` manifest/meta entries so icon config is single-source from metadata.

**Logo placements added:**
- Login page (`app/auth/login/page.tsx`): centered `logo-full.svg` above form title.
- Signup page (`app/auth/signup/page.tsx`): centered `logo-full.svg` above form title.
- Sidebar (`components/RoleSidebar.tsx`, `components/role-sidebar.module.css`):
  - expanded: `logo-full.svg`
  - collapsed: `logo-icon.svg`
- Loading overlay (`app/loading.tsx`, `app/loading.module.css`):
  - centered `logo-icon.svg`
  - subtle opacity pulse (`1s ease-in-out infinite`)
  - no slogan and no large-scale animation.
- Product image placeholders:
  - `app/student/restaurant/[id]/page.tsx` + `app/student/restaurant/[id]/menu.module.css`
  - `app/restaurant/dashboard/page.tsx` + `app/restaurant/dashboard/dashboard.module.css`
  - centered `logo-icon.svg` with low opacity (`0.3`), preserved aspect ratio.

**Files modified:**
- `app/layout.tsx`
- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `app/auth/login/auth.module.css`
- `components/RoleSidebar.tsx`
- `components/role-sidebar.module.css`
- `app/loading.tsx`
- `app/loading.module.css`
- `app/student/restaurant/[id]/page.tsx`
- `app/student/restaurant/[id]/menu.module.css`
- `app/restaurant/dashboard/page.tsx`
- `app/restaurant/dashboard/dashboard.module.css`
- `PROJECT_STRUCTURE.md`
- `PROMPT_LOG.md`

**Validation / build results:**
- `npm run build` (frontend): passed
- `npx tsc --noEmit`: passed

## SVG Optimization Pass

**Scope constraints followed:**
- No backend changes.
- No TS/JS logic changes.
- SVG-only optimization applied to files in `public/`.

**Tooling:**
- Installed dev dependency: `svgo`.
- Command used: `npx svgo public/logo-full.svg public/logo-icon.svg --multipass -o public`

**Files optimized:**
- `public/logo-full.svg`
- `public/logo-icon.svg`

**Optimization notes:**
- Removed/minified redundant metadata/style/comment payload where safe.
- Preserved `viewBox` in both files.
- Kept width/height on embedded image nodes.
- No visual-targeted structure changes introduced.

**Size reduction:**
- `public/logo-full.svg`: `5,380,969` -> `5,380,913` bytes (`-56 bytes`)
- `public/logo-icon.svg`: `541,331` -> `540,398` bytes (`-933 bytes`)

**Validation commands requested for this pass:**
- `npm run build`
- `npx tsc --noEmit`
