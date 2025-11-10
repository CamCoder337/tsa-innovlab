import { create } from 'zustand';
import type {
  Order,
  OrderStore,
  CreateOrderRequest,
  OrderStatus,
  OrderFiltersQuery,
} from '@/types/order.types';
import { shopService } from '@/services/shop.service';
import { createJSONStorage, persist } from 'zustand/middleware';

const initialState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      fetchOrders: async (params?: OrderFiltersQuery) => {
        set({ isLoading: true, error: null });

        try {
          const response = await shopService.getOrders(params);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              orders: response.data.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch orders',
            isLoading: false,
          });
        }
      },

      fetchOrder: async (orderId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await shopService.getOrder(orderId);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              currentOrder: response.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch order',
            isLoading: false,
          });
        }
      },

      createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
        set({ isLoading: true, error: null });

        try {
          const response = await shopService.createOrder(orderData);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            throw new Error(response.error.message);
          }

          if (response.data) {
            // Extract the order from the response (it's wrapped in a Record<string, Order>)
            const order = response.data;

            // Add the new order to the orders list
            const { orders } = get();
            set({
              orders: [order, ...orders],
              currentOrder: order,
              isLoading: false,
              error: null,
            });

            return order;
          }

          throw new Error('No order data received');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create order',
            isLoading: false,
          });
          throw error;
        }
      },

      updateOrderStatus: async (orderId: string, status: OrderStatus) => {
        set({ isLoading: true, error: null });

        try {
          const { orders, currentOrder } = get();

          // Update in orders list
          const updatedOrders = orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          );

          // Update current order if it matches
          const updatedCurrentOrder =
            currentOrder?.id === orderId ? { ...currentOrder, status } : currentOrder;

          set({
            orders: updatedOrders,
            currentOrder: updatedCurrentOrder,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update order status',
            isLoading: false,
          });
        }
      },

      cancelOrder: async (orderId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await shopService.cancelOrder(orderId);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            // Extract the cancelled order from the response
            const cancelledOrder = Object.values(response.data)[0];

            // Update the orders list
            const { orders, currentOrder } = get();
            const updatedOrders = orders.map((order) =>
              order.id === orderId ? cancelledOrder : order
            );

            // Update current order if it matches
            const updatedCurrentOrder =
              currentOrder?.id === orderId ? cancelledOrder : currentOrder;

            set({
              orders: updatedOrders,
              currentOrder: updatedCurrentOrder,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to cancel order',
            isLoading: false,
          });
        }
      },

      // Utility actions
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          orders: [],
          currentOrder: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'tsa_orders',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        orders: state.orders,
        currentOrder: state.currentOrder,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);
