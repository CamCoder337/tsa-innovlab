import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  Order,
  AdminOrderFilterParams,
  AdminOrderStats,
  RefundOrderRequest,
  BulkOrderActionRequest,
  BulkOrderActionResult,
  UpdateOrderStatusRequest,
} from '@/types/order.types';
import { adminService } from '@/services/admin.service';

interface AdminOrderState {
  // Data
  orders: Order[];
  currentOrder: Order | null;
  stats: AdminOrderStats | null;

  // Pagination
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };

  // Filters (persisted)
  filters: AdminOrderFilterParams;

  // UI State (not persisted)
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: (params?: AdminOrderFilterParams) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, data: UpdateOrderStatusRequest) => Promise<Order | null>;
  cancelOrder: (orderId: string, reason?: string) => Promise<Order | null>;
  refundOrder: (orderId: string, data: RefundOrderRequest) => Promise<Order | null>;
  fetchStats: () => Promise<void>;
  exportOrders: (params?: Partial<AdminOrderFilterParams>) => Promise<void>;
  bulkAction: (data: BulkOrderActionRequest) => Promise<BulkOrderActionResult | null>;

  // Utility
  setCurrentOrder: (order: Order | null) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: AdminOrderFilterParams) => void;
  reset: () => void;
}

const initialState = {
  orders: [],
  currentOrder: null,
  stats: null,
  pagination: {
    total: 0,
    perPage: 20,
    currentPage: 1,
    lastPage: 1,
  },
  filters: {},
  isLoading: false,
  error: null,
};

export const useAdminOrderStore = create<AdminOrderState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Fetch all orders with filters
      fetchOrders: async (params?: AdminOrderFilterParams) => {
        set({ isLoading: true, error: null });

        // Save filters
        if (params) {
          set({ filters: params });
        }

        try {
          const response = await adminService.adminGetOrders(params);

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
              pagination: {
                total: response.data.meta.total,
                perPage: response.data.meta.perPage,
                currentPage: response.data.meta.currentPage,
                lastPage: response.data.meta.lastPage,
              },
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

      // Fetch single order
      fetchOrder: async (orderId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await adminService.adminGetOrder(orderId);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return null;
          }

          if (response.data) {
            set({
              currentOrder: response.data,
              isLoading: false,
              error: null,
            });
            return response.data;
          }

          return null;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch order',
            isLoading: false,
          });
          return null;
        }
      },

      // Update order status
      updateOrderStatus: async (orderId: string, data: UpdateOrderStatusRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await adminService.adminUpdateOrderStatus(orderId, data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return null;
          }

          if (response.data) {
            const { orders, currentOrder } = get();

            // Update in orders list
            const updatedOrders = orders.map((order) =>
              order.id === orderId ? response.data! : order
            );

            // Update current order if it matches
            const updatedCurrentOrder = currentOrder?.id === orderId ? response.data : currentOrder;

            set({
              orders: updatedOrders,
              currentOrder: updatedCurrentOrder,
              isLoading: false,
              error: null,
            });

            return response.data;
          }

          return null;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update order status',
            isLoading: false,
          });
          return null;
        }
      },

      // Cancel order
      cancelOrder: async (orderId: string, reason?: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await adminService.adminCancelOrder(orderId, reason);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return null;
          }

          if (response.data) {
            const { orders, currentOrder } = get();

            // Update in orders list
            const updatedOrders = orders.map((order) =>
              order.id === orderId ? response.data! : order
            );

            // Update current order if it matches
            const updatedCurrentOrder = currentOrder?.id === orderId ? response.data : currentOrder;

            set({
              orders: updatedOrders,
              currentOrder: updatedCurrentOrder,
              isLoading: false,
              error: null,
            });

            return response.data;
          }

          return null;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to cancel order',
            isLoading: false,
          });
          return null;
        }
      },

      // Refund order
      refundOrder: async (orderId: string, data: RefundOrderRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await adminService.adminRefundOrder(orderId, data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return null;
          }

          if (response.data) {
            const { orders, currentOrder } = get();

            // Update in orders list
            const updatedOrders = orders.map((order) =>
              order.id === orderId ? response.data! : order
            );

            // Update current order if it matches
            const updatedCurrentOrder = currentOrder?.id === orderId ? response.data : currentOrder;

            set({
              orders: updatedOrders,
              currentOrder: updatedCurrentOrder,
              isLoading: false,
              error: null,
            });

            return response.data;
          }

          return null;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refund order',
            isLoading: false,
          });
          return null;
        }
      },

      // Fetch stats
      fetchStats: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await adminService.getAdminOrderStats();

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              stats: response.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch stats',
            isLoading: false,
          });
        }
      },

      // Export orders
      exportOrders: async (params?: Partial<AdminOrderFilterParams>) => {
        set({ isLoading: true, error: null });

        try {
          const response = await adminService.exportOrders(params);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            // Create download link
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orders-export-${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            set({ isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to export orders',
            isLoading: false,
          });
        }
      },

      // Bulk action
      bulkAction: async (data: BulkOrderActionRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await adminService.bulkOrderAction(data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return null;
          }

          if (response.data) {
            set({ isLoading: false });
            return response.data;
          }

          return null;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to perform bulk action',
            isLoading: false,
          });
          return null;
        }
      },

      // Utility actions
      setCurrentOrder: (order: Order | null) => {
        set({ currentOrder: order });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setFilters: (filters: AdminOrderFilterParams) => {
        set({ filters });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'tsa_admin_orders',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        orders: state.orders,
        currentOrder: state.currentOrder,
        stats: state.stats,
        pagination: state.pagination,
        filters: state.filters,
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
