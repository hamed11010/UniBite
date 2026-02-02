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

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

## Testing Different User Roles

**Note:** Role assignment is explicit and based on specific email patterns (MOCK/DEMO ONLY).

### Student Account
- Use any email ending with `@miuegypt.edu.eg` (e.g., `userseed@miuegypt.edu.eg`, `student@miuegypt.edu.eg`)
- Password can be anything (mock authentication)
- Can sign up via the signup page
- Will be redirected to `/student/home`

### Restaurant Admin Account
- **Exact email:** `miniadmintest@anything.com`
- Password can be anything (mock authentication)
- **Cannot sign up** - must use login page
- Will be redirected to `/restaurant/dashboard`
- Assigned to restaurant ID "rest1" by default

### Super Admin Account
- **Exact email:** `superadmintest@anything.com`
- Password can be anything (mock authentication)
- **Cannot sign up** - must use login page
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

## Backend Integration (Future)

When ready to connect to a backend:

1. **API Configuration**
   - Update `lib/mockData.ts` to use API calls instead of mock data
   - Create API utility functions in `lib/api.ts` or similar
   - Replace `sessionStorage` calls with API requests

2. **Authentication**
   - Replace mock authentication in `app/auth/login/page.tsx` and `app/auth/signup/page.tsx`
   - Implement JWT token storage (consider using httpOnly cookies for security)
   - Add token refresh logic

3. **Real-time Updates**
   - Replace setTimeout-based order status updates with WebSocket connection
   - Or implement polling mechanism for order status

4. **State Management**
   - Consider adding a state management library (Redux, Zustand, etc.) if needed
   - Replace sessionStorage with proper state management

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

## Support

For issues or questions:
1. Check the `PROMPT_LOG.md` for implementation details
2. Review `PROJECT_STRUCTURE.md` for code organization
3. Check Next.js documentation: https://nextjs.org/docs
