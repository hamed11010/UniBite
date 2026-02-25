export const ORDER_STATUS = {
  RECEIVED: 'RECEIVED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  DELIVERED_TO_STUDENT: 'DELIVERED_TO_STUDENT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_FILTER = {
  ALL: 'ALL',
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusFilter =
  (typeof ORDER_STATUS_FILTER)[keyof typeof ORDER_STATUS_FILTER];

export function formatOrderStatus(status: OrderStatus): string {
  if (status === ORDER_STATUS.DELIVERED_TO_STUDENT) {
    return 'Delivered To Student';
  }
  return status.charAt(0) + status.slice(1).toLowerCase();
}
