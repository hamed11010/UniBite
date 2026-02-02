# Project Structure

This document describes the folder and file structure of the UniBite frontend application.

## Root Directory

```
UniBite/
├── app/                    # Next.js App Router directory
├── lib/                    # Shared utilities and data
├── public/                 # Static assets
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
├── .gitignore            # Git ignore rules
├── PROMPT_LOG.md         # Prompt implementation log
├── PROJECT_STRUCTURE.md   # This file
└── MANUAL_ACTIONS.md     # Manual setup instructions
```

## App Directory (`app/`)

Next.js App Router structure. Each folder represents a route.

### Root Layout
- `layout.tsx` - Root layout component with PWA meta tags
- `globals.css` - Global CSS styles
- `page.tsx` - University Selection page (landing page)

### Authentication Routes (`app/auth/`)
- `login/page.tsx` - Login page component
- `signup/page.tsx` - Signup page component
- `login/auth.module.css` - Shared styles for auth pages

### Student Routes (`app/student/`)
- `home/page.tsx` - Student home page with restaurant listings
- `home/home.module.css` - Student home styles
- `restaurant/[id]/page.tsx` - Restaurant menu page (dynamic route)
- `restaurant/[id]/menu.module.css` - Menu page styles
- `cart/page.tsx` - Shopping cart page
- `cart/cart.module.css` - Cart page styles
- `order/[id]/page.tsx` - Order status tracking page (dynamic route)
- `order/[id]/order.module.css` - Order status styles

### Restaurant Admin Routes (`app/restaurant/`)
- `dashboard/page.tsx` - Restaurant admin dashboard
- `dashboard/dashboard.module.css` - Dashboard styles

### Platform Admin Routes (`app/admin/`)
- `dashboard/page.tsx` - Platform admin dashboard
- `dashboard/admin.module.css` - Admin dashboard styles

## Library Directory (`lib/`)

Shared utilities and mock data.

- `mockData.ts` - Mock data for restaurants, products, orders, and TypeScript interfaces

## Public Directory (`public/`)

Static assets served at the root URL.

- `manifest.json` - PWA manifest file for app installation

## Key Features by Route

### `/` (Root)
- University selection screen
- Only MIU is active, others show "Coming soon"

### `/auth/login` & `/auth/signup`
- Email/password authentication
- Only @miuegypt.edu.eg emails allowed
- Mock authentication using sessionStorage

### `/student/home`
- Lists all restaurants
- Shows open/closed status
- Displays "Opens at X" for closed restaurants

### `/student/restaurant/[id]`
- Menu grouped by categories
- Product cards with images (placeholders)
- Modal for adding items to cart with:
  - Quantity selector
  - Sauce selection (if enabled)
  - Optional comment field

### `/student/cart`
- View cart items
- Adjust quantities
- Remove items
- Warning about non-editable orders
- Checkout button

### `/student/order/[id]`
- Order status display
- Status updates: received → preparing → ready
- Estimated time display
- Order details with items and total

### `/restaurant/dashboard`
- Three tabs: Orders, Menu Management, Settings
- Orders: View incoming orders, update status, cancel orders
- Menu: Placeholder for menu management (future implementation)
- Settings: Open/close toggle, working hours

### `/admin/dashboard`
- View all restaurants
- Add new restaurants
- Remove restaurants
- Force open/close restaurants
- Restaurant admin assignment (placeholder)

## State Management

Currently uses `sessionStorage` for:
- User authentication state
- Selected university
- Shopping cart
- Orders
- User role and restaurant assignment

## Styling Approach

- CSS Modules for component-scoped styles
- Global styles in `globals.css`
- Consistent color scheme: Purple gradient (#667eea to #764ba2)
- Responsive design with mobile-first approach

## Data Flow

1. **Authentication**: User selects university → logs in → role determined → redirected to appropriate dashboard
2. **Student Flow**: Browse restaurants → View menu → Add to cart → Checkout → Track order
3. **Restaurant Flow**: View orders → Update status → Manage menu (future) → Adjust settings
4. **Admin Flow**: Manage restaurants → Assign admins (future) → Force operations
