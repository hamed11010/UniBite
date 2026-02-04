# Manual Actions Required

This document lists all actions that must be performed manually by the developer.

## Initial Setup

### 1. Install Dependencies

Run the following command in the project root:

```bash
npm install
```

This will install all required dependencies including Next.js, React, TypeScript, and ESLint.

### 2. Create PWA Icons

The PWA manifest references icon files that need to be created:

- `public/icon-192.png` - 192x192 pixel icon
- `public/icon-512.png` - 512x512 pixel icon

**Action Required:** Create these icon files with the UniBite logo/branding. You can use any image editing tool or online icon generator.

### 3. Environment Setup

Currently, the application uses mock data stored in `sessionStorage`. No environment variables are required for the frontend-only implementation.

**Future Note:** When connecting to a backend, you'll need to:
- Create `.env.local` file
- Add API endpoint URLs
- Add authentication tokens/secrets if needed

## Development

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3001`

### Building for Production

```bash
npm run build
npm start
```

## Testing Different User Roles

**Note:** Authentication is now fully backend-driven. Roles are determined by the backend database.

### Student Account
- Must select a university first
- Email must match one of the selected university's allowed email domains
- Can sign up via the signup page (STUDENT role only)
- Will be redirected to `/student/home` after login

### Restaurant Admin Account
- Must select a university first
- Email domain validation is not enforced (backend validates university association)
- **Cannot sign up** - must be created by Super Admin
- Must use login page
- Will be redirected to `/restaurant/dashboard` after login

### Super Admin Account
- University selection does not restrict login (can select any university)
- **Cannot sign up** - must be created manually in database
- Must use login page
- Will be redirected to `/admin/dashboard` (Super Admin Dashboard)
- Has access to overview statistics and full restaurant management

## PWA Installation

### Testing PWA Features

1. Build the application: `npm run build`
2. Serve it: `npm start`
3. Open in Chrome/Edge
4. Use DevTools > Application > Manifest to verify PWA configuration
5. Use "Add to Home Screen" prompt to test installation

### PWA Requirements Checklist

- ✅ Manifest file created (`public/manifest.json`)
- ⚠️ Icons need to be created (see Initial Setup #2)
- ✅ Service worker (Next.js handles this automatically in production build)
- ✅ HTTPS (required for PWA, use localhost for development)

## Port Configuration (Important)

The application uses specific ports to avoid conflicts:

- **Frontend (Next.js):** `http://localhost:3001`
- **Backend (NestJS API):** `http://localhost:4000`
- **Database (PostgreSQL):** `localhost:5432` (Docker)

These ports must be:
- Used consistently across all configuration files
- Reflected in `.env` files, frontend API calls, and CORS config
- Documented in all relevant documentation

## Deployment Considerations

### Vercel (Recommended for Next.js)

1. Push code to GitHub/GitLab
2. Import project in Vercel
3. Vercel will auto-detect Next.js and configure build settings
4. Add environment variables if needed
5. Deploy

### Other Platforms

- Ensure Node.js 18+ is available
- Set build command: `npm run build`
- Set start command: `npm start`
- Ensure PWA icons are included in deployment

## Known Limitations

1. **Menu Management**: The restaurant menu management interface is a placeholder. Full CRUD operations need to be implemented.

2. **Image Uploads**: Product image uploads are not implemented. Currently using placeholders.

3. **Sauce Management**: Global sauce list is hardcoded. Should be managed through restaurant settings.

4. **Order History**: Students cannot view past orders. This feature needs to be added.

5. **Search/Filter**: No search or filter functionality for restaurants or menu items.

6. **Notifications**: No push notifications for order status updates.

## Suggestions for Enhancement

1. **Error Handling**: Add proper error boundaries and error messages
2. **Loading States**: Add loading spinners/skeletons for better UX
3. **Form Validation**: Enhance client-side validation with better error messages
4. **Accessibility**: Add ARIA labels and keyboard navigation improvements
5. **Internationalization**: Add i18n support if multiple languages are needed
6. **Analytics**: Integrate analytics for tracking user behavior
7. **Offline Support**: Implement service worker for offline functionality
8. **Image Optimization**: Use Next.js Image component for optimized images

## Security Notes

⚠️ **Important:** The current implementation uses `sessionStorage` for authentication, which is NOT secure for production. When implementing backend:

- Use httpOnly cookies for authentication tokens
- Implement CSRF protection
- Add rate limiting for authentication endpoints
- Validate all inputs on the backend
- Use HTTPS in production
- Implement proper session management

## Backend Setup (Phase 2A+)

### Prisma Migrations

After schema changes, create and apply migrations:

```bash
cd backend
npx prisma migrate dev --name migration_name
```

**Important:** After adding the University model (Phase 2A), run:
```bash
npx prisma migrate dev --name add_university_model
```

This will:
- Create a new migration file
- Apply the migration to the database
- Regenerate Prisma Client

### Generate Prisma Client

After schema changes or migrations:

```bash
cd backend
npx prisma generate
```

### Backend Restart

After migrations or code changes:

```bash
cd backend
# Stop the server (Ctrl+C if running)
npm run start:dev
```

### Environment Variables

Backend requires `.env` file in `backend/` directory:

```env
DATABASE_URL="postgresql://unibite:unibite_password@localhost:5432/unibite_db?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
NODE_ENV="development"
PORT=4000
FRONTEND_URL="http://localhost:3001"
```

**Note:** No secrets should be committed to version control. `.env` is already in `.gitignore`.

### Frontend API Configuration

Frontend uses `NEXT_PUBLIC_API_URL` environment variable (optional):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
```

If not set, defaults to `http://127.0.0.1:4000`.

**Note:** Frontend runs on port 3001, backend API on port 4000. This separation is intentional.

### Authentication (Cookie-Based)

The application uses **httpOnly cookies** for authentication:

- **Login:** Sets JWT token in httpOnly cookie via `/auth/login`
- **Auth Check:** Uses `/auth/me` endpoint to verify authentication
- **Logout:** Clears cookie via `/auth/logout` endpoint
- **No sessionStorage:** Authentication state is NOT stored in sessionStorage
- **Cookie Persistence:** User stays logged in after page refresh

**Important:**
- Cookies are required for authentication to work
- If experiencing auth issues, clear browser cookies and log in again
- Backend must be running on port 4000 for auth to work
- Frontend must be running on port 3001 (different port to avoid conflicts)
- CORS is configured to allow credentials between frontend and backend

## Support

For issues or questions:
1. Check the `PROMPT_LOG.md` for implementation details
2. Review `PROJECT_STRUCTURE.md` for code organization
3. Check Next.js documentation: https://nextjs.org/docs
4. Check NestJS documentation: https://docs.nestjs.com