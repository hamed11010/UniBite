# FUTURE PLAN (Not Implemented Yet)

This document lists future features that depend on HTTPS and production infrastructure.
They are intentionally **not implemented** in the current localhost phase.

## Future HTTPS-Required Features

### Web Push Notifications
- Add browser push delivery for background notifications when the app is closed.
- Keep current in-app notifications and realtime sockets as the primary local implementation.

### Service Worker Setup
- Register a Service Worker in production frontend builds.
- Handle push events in the Service Worker and display system notifications.
- Add notification click handlers for deep linking to order/report/notification pages.

### VAPID Key Generation
- Generate and store VAPID public/private keys securely.
- Expose only the public key to frontend clients.
- Rotate keys with controlled migration strategy.

### Push Subscription Storage
- Add backend endpoints for subscription create/update/delete.
- Store subscriptions per authenticated user with device metadata.
- Clean up invalid/expired subscriptions based on push provider feedback.

### HTTPS Requirement
- Web Push APIs require secure contexts in browsers.
- Production deployment must use HTTPS for Service Worker and PushManager reliability.
- Localhost development remains non-push realtime for now.

### Browser Support Considerations
- Validate feature support differences across Chromium, Firefox, and Safari.
- Provide graceful fallback to in-app notifications when push is unavailable.

### iOS Safari Limitations
- Validate iOS Safari web push behavior and permission UX constraints.
- Plan platform-specific copy and fallback behavior for unsupported cases.

## Production Deployment Checklist

### Domain Acquisition
- Provision a stable public domain for frontend and backend.
- Define subdomain strategy (for example: `api.example.com`, `app.example.com`).

### SSL Certificate
- Configure TLS certificates and automated renewal.
- Enforce HTTPS redirection at edge/reverse proxy.

### Secure Cookies Enforcement
- Keep auth cookie `httpOnly`.
- Enforce `secure: true` in production.
- Keep `sameSite` policy aligned with frontend/backend domain strategy.

### Environment Configuration
- Set strong production secrets (`JWT_SECRET`, DB credentials, push keys).
- Separate development/staging/production env files and secret stores.

### Redis-Backed Rate Limiting (Future Scaling)
- Move from in-memory throttling to distributed store-backed throttling.
- Ensure consistent limits across multiple backend instances.

### WebSocket Scaling Strategy
- Add socket adapter/pub-sub layer (for example Redis adapter) for horizontal scaling.
- Ensure room-based events propagate across all backend nodes.

## Native App Future Considerations

### FCM Integration
- Plan Firebase Cloud Messaging integration for Android native clients.
- Keep notification payload contracts aligned with backend event model.

### APNs Integration
- Plan Apple Push Notification service integration for iOS native clients.
- Align token registration lifecycle with backend notification subscriptions.

---

Status: **Planned only**.  
Current phase implements only database notifications + realtime socket events for localhost.
