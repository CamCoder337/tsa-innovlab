import { OrderStatus, PaymentStatus, type Order } from '@/types/order.types';

/**
 * Get the appropriate color class for an order status
 */
export function getOrderStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'paid':
      return 'bg-tsa-blue/90';
    case 'processing':
      return 'bg-purple-500';
    case 'shipped':
      return 'bg-indigo-500';
    case 'delivered':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    case 'refunded':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Get the human-readable label for an order status
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'En Attente';
    case 'paid':
      return 'Payée';
    case 'processing':
      return 'En Traitement';
    case 'shipped':
      return 'Expédiée';
    case 'delivered':
      return 'Livrée';
    case 'cancelled':
      return 'Annulée';
    case 'refunded':
      return 'Remboursée';
    default:
      return 'Inconnu';
  }
}

/**
 * Get the appropriate color class for a payment status
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'completed':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    case 'refunded':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Get the human-readable label for a payment status
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return 'En Attente';
    case 'completed':
      return 'Complété';
    case 'failed':
      return 'Échoué';
    case 'refunded':
      return 'Remboursé';
    default:
      return 'Inconnu';
  }
}

/**
 * Check if an order can be cancelled
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return ['pending', 'paid', 'processing'].includes(status);
}

/**
 * Check if an order can be refunded
 */
export function canRefundOrder(status: OrderStatus, paymentStatus: PaymentStatus): boolean {
  return status === 'delivered' && paymentStatus === 'completed';
}

/**
 * Check if an order can be shipped
 */
export function canShipOrder(status: OrderStatus): boolean {
  return ['paid', 'processing'].includes(status);
}

/**
 * Check if an order can be marked as delivered
 */
export function canMarkDelivered(status: OrderStatus): boolean {
  return status === 'shipped';
}

/**
 * Get the next possible statuses for an order
 */
export function getNextOrderStatuses(currentStatus: OrderStatus): OrderStatus[] {
  switch (currentStatus) {
    case OrderStatus.PENDING:
      return [OrderStatus.PAID, OrderStatus.CANCELLED];
    case OrderStatus.PAID:
      return [OrderStatus.PROCESSING, OrderStatus.CANCELLED];
    case OrderStatus.PROCESSING:
      return [OrderStatus.SHIPPED, OrderStatus.CANCELLED];
    case OrderStatus.SHIPPED:
      return [OrderStatus.DELIVERED];
    case OrderStatus.DELIVERED:
      return [OrderStatus.REFUNDED];
    case OrderStatus.CANCELLED:
    case OrderStatus.REFUNDED:
      return [];
    default:
      return [];
  }
}

/**
 * Get order urgency indicator
 */
export function getOrderUrgency(order: Order): {
  level: 'urgent' | 'normal' | 'low';
  message?: string;
} {
  const daysSinceOrder = Math.floor(
    (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (order.status === 'pending' && daysSinceOrder > 3) {
    return {
      level: 'urgent',
      message: `Commande en attente depuis ${daysSinceOrder} jours`,
    };
  }

  if (order.status === 'processing' && daysSinceOrder > 5) {
    return {
      level: 'urgent',
      message: `En traitement depuis ${daysSinceOrder} jours`,
    };
  }

  if (order.status === 'shipped' && daysSinceOrder > 7) {
    return {
      level: 'urgent',
      message: `Expédiée depuis ${daysSinceOrder} jours`,
    };
  }

  return { level: 'normal' };
}
