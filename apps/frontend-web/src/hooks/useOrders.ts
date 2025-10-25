import { useOrderStore } from '@/stores/orderStore';
import type { OrderStatus } from '@/types/order.types';

/**
 * Custom hook for order operations
 * Provides a clean interface to the order store
 */
export const useOrders = () => {
  const {
    orders,
    currentOrder,
    isLoading,
    error,
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    setError,
    clearError,
    reset,
  } = useOrderStore();

  // Helper methods
  const getOrderById = (orderId: string) => {
    return orders.find((order) => order.id === orderId);
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status);
  };

  const getTotalOrders = () => {
    return orders.length;
  };

  const hasOrders = () => {
    return orders.length > 0;
  };

  return {
    // State
    orders,
    currentOrder,
    isLoading,
    error,

    // Actions
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    reset,

    // Getters
    getOrderById,
    getOrdersByStatus,
    getTotalOrders,
    hasOrders,

    // Utility
    clearError,
    setError,
  };
};
