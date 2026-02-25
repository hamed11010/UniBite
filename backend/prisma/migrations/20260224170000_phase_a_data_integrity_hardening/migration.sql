-- Phase A: Data Integrity Hardening indexes
CREATE INDEX "orders_restaurantId_status_idx" ON "orders"("restaurantId", "status");
CREATE INDEX "orders_studentId_idx" ON "orders"("studentId");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
CREATE INDEX "orders_restaurantId_createdAt_idx" ON "orders"("restaurantId", "createdAt");

CREATE INDEX "reports_status_idx" ON "reports"("status");
CREATE INDEX "reports_restaurantId_idx" ON "reports"("restaurantId");

CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
