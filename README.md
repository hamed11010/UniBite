# UniBite

**Taste the campus vibe**

UniBite is a campus food ordering platform built with Next.js. This is the frontend application with mock data - ready for backend integration.

## Features

- 🏫 University selection (MIU available, others coming soon)
- 🔐 Authentication (Login/Signup with @miuegypt.edu.eg emails)
- 👨‍🎓 Student experience:
  - Browse restaurants
  - View menus by category
  - Add items to cart with customizations
  - Track order status
- 🍔 Restaurant admin dashboard:
  - Manage incoming orders
  - Update order status
  - Restaurant settings
- 👑 Platform admin dashboard:
  - Manage restaurants
  - Force open/close operations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **PWA**: Ready for Progressive Web App installation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create PWA icons (see `MANUAL_ACTIONS.md`):
   - `public/icon-192.png` (192x192)
   - `public/icon-512.png` (512x512)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

See `PROJECT_STRUCTURE.md` for detailed file organization.

## Documentation

- `PROMPT_LOG.md` - Implementation history and notes
- `PROJECT_STRUCTURE.md` - File structure and organization
- `MANUAL_ACTIONS.md` - Manual setup steps and deployment guide

## Testing User Roles

### Student
- Email: `student@miuegypt.edu.eg`
- Password: (any)
- Access: Student home, restaurants, cart, orders

### Restaurant Admin
- Email: `admin@miuegypt.edu.eg` (contains "admin")
- Password: (any)
- Access: Restaurant dashboard

### Platform Admin
- Email: (needs manual role assignment in code)
- Access: Platform admin dashboard

## Build for Production

```bash
npm run build
npm start
```

## Notes

- All data is stored in `sessionStorage` (mock implementation)
- No backend integration yet - ready for API connection
- PWA icons need to be created manually
- See `MANUAL_ACTIONS.md` for complete setup instructions

## License

This project is part of the UniBite platform.
