import { useOrderStore } from '@/stores/orderStore';
import type { CreateOrderRequest, OrderStatus } from '@/types/order.types';

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

  // Enhanced methods with additional logic
  const loadOrders = async () => {
    try {
      clearError();
      await fetchOrders();
    } catch (error) {
      setError('Failed to load orders');
      console.error('Error loading orders:', error);
    }
  };

  const loadOrder = async (orderId: string) => {
    try {
      clearError();
      const order = await fetchOrder(orderId);
      return order;
    } catch (error) {
      setError('Failed to load order');
      console.error('Error loading order:', error);
    }
  };

  const placeOrder = async (orderData: CreateOrderRequest) => {
    try {
      clearError();
      const order = await createOrder(orderData);
      return order;
    } catch (error) {
      setError('Failed to create order');
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      clearError();
      await updateOrderStatus(orderId, status);
    } catch (error) {
      setError('Failed to update order status');
      console.error('Error updating order status:', error);
    }
  };

  const cancelOrderById = async (orderId: string) => {
    try {
      clearError();
      await cancelOrder(orderId);
    } catch (error) {
      setError('Failed to cancel order');
      console.error('Error cancelling order:', error);
    }
  };

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
    loadOrders,
    loadOrder,
    placeOrder,
    updateStatus,
    cancelOrderById,
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
