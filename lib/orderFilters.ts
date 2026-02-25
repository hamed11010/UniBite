import {
  ORDER_STATUS,
  ORDER_STATUS_FILTER,
  type OrderStatusFilter,
} from './status';

export type { OrderStatusFilter };

export type RestaurantOrdersSubTab = 'incoming' | 'today';

export function mapAdminOrderStatusFilter(
  status: OrderStatusFilter,
): string | undefined {
  if (status === ORDER_STATUS_FILTER.ALL) return undefined;
  if (status === ORDER_STATUS_FILTER.PENDING) return ORDER_STATUS.RECEIVED;
  return status;
}

export function mapRestaurantOrderStatuses(
  tab: RestaurantOrdersSubTab,
  status: OrderStatusFilter,
): string[] {
  if (status === ORDER_STATUS_FILTER.ALL) {
    return tab === 'incoming'
      ? [ORDER_STATUS.RECEIVED, ORDER_STATUS.PREPARING]
      : [
          ORDER_STATUS.RECEIVED,
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.READY,
          ORDER_STATUS.DELIVERED_TO_STUDENT,
          ORDER_STATUS.COMPLETED,
          ORDER_STATUS.CANCELLED,
        ];
  }

  if (status === ORDER_STATUS_FILTER.PENDING) return [ORDER_STATUS.RECEIVED];
  return [status];
}
