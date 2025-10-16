import { create } from 'zustand';
import type {
  Order,
  OrderStore,
  CreateOrderRequest,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/types/order.types';
import { shopService } from '@/services/shop.service';

// Mock orders data for development
const mockOrders: Order[] = [
  {
    id: '1',
    userId: 'user-1',
    orderNumber: 'ORD-20241014-0001',
    status: 'pending' as OrderStatus,
    paymentMethod: 'orange_money' as PaymentMethod,
    paymentStatus: 'pending' as PaymentStatus,
    paymentReference: null,
    subtotal: '25000',
    shippingCost: '2500',
    tax: '2750',
    total: '30250',
    shippingAddressId: 'addr-1',
    billingAddressId: 'addr-1',
    customerName: 'Jean Dupont',
    customerEmail: 'jean.dupont@email.com',
    customerPhone: '+237 6 XX XX XX XX',
    notes: 'Livraison en matinée de préférence',
    trackingNumber: null,
    items: [
      {
        id: 'item-1',
        orderId: '1',
        productId: 'prod-1',
        productName: 'Smartphone Samsung Galaxy A54',
        productReference: 'SAM-A54-128GB',
        productImageUrl: 'https://via.placeholder.com/150',
        quantity: 1,
        unitPrice: '25000',
        subtotal: '25000',
        createdAt: '2024-10-14T08:00:00Z',
        updatedAt: '2024-10-14T08:00:00Z',
      },
    ],
    paidAt: null,
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    createdAt: '2024-10-14T08:00:00Z',
    updatedAt: '2024-10-14T08:00:00Z',
  },
  {
    id: '2',
    userId: 'user-1',
    orderNumber: 'ORD-20241013-0002',
    status: 'paid' as OrderStatus,
    paymentMethod: 'mtn_momo' as PaymentMethod,
    paymentStatus: 'completed' as PaymentStatus,
    paymentReference: 'MTN-20241013-ABC123',
    subtotal: '45000',
    shippingCost: '3000',
    tax: '4800',
    total: '52800',
    shippingAddressId: 'addr-1',
    billingAddressId: 'addr-1',
    customerName: 'Jean Dupont',
    customerEmail: 'jean.dupont@email.com',
    customerPhone: '+237 6 XX XX XX XX',
    notes: null,
    trackingNumber: null,
    items: [
      {
        id: 'item-2',
        orderId: '2',
        productId: 'prod-2',
        productName: 'Ordinateur portable HP Pavilion',
        productReference: 'HP-PAV-15-I5',
        productImageUrl: 'https://via.placeholder.com/150',
        quantity: 1,
        unitPrice: '45000',
        subtotal: '45000',
        createdAt: '2024-10-13T14:30:00Z',
        updatedAt: '2024-10-13T14:30:00Z',
      },
    ],
    paidAt: '2024-10-13T14:35:00Z',
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    createdAt: '2024-10-13T14:30:00Z',
    updatedAt: '2024-10-13T14:35:00Z',
  },
  {
    id: '3',
    userId: 'user-1',
    orderNumber: 'ORD-20241012-0003',
    status: 'shipped' as OrderStatus,
    paymentMethod: 'wave' as PaymentMethod,
    paymentStatus: 'completed' as PaymentStatus,
    paymentReference: 'WAVE-20241012-XYZ789',
    subtotal: '15000',
    shippingCost: '2000',
    tax: '1700',
    total: '18700',
    shippingAddressId: 'addr-1',
    billingAddressId: 'addr-1',
    customerName: 'Jean Dupont',
    customerEmail: 'jean.dupont@email.com',
    customerPhone: '+237 6 XX XX XX XX',
    notes: 'Fragile - Manipuler avec précaution',
    trackingNumber: 'TRK-20241012-001',
    items: [
      {
        id: 'item-3',
        orderId: '3',
        productId: 'prod-3',
        productName: 'Écouteurs sans fil AirPods',
        productReference: 'APPLE-AIRPODS-3',
        productImageUrl: 'https://via.placeholder.com/150',
        quantity: 1,
        unitPrice: '15000',
        subtotal: '15000',
        createdAt: '2024-10-12T10:15:00Z',
        updatedAt: '2024-10-12T10:15:00Z',
      },
    ],
    paidAt: '2024-10-12T10:20:00Z',
    shippedAt: '2024-10-13T09:00:00Z',
    deliveredAt: null,
    cancelledAt: null,
    createdAt: '2024-10-12T10:15:00Z',
    updatedAt: '2024-10-13T09:00:00Z',
  },
  {
    id: '4',
    userId: 'user-1',
    orderNumber: 'ORD-20241010-0004',
    status: 'delivered' as OrderStatus,
    paymentMethod: 'cash_on_delivery' as PaymentMethod,
    paymentStatus: 'completed' as PaymentStatus,
    paymentReference: null,
    subtotal: '8500',
    shippingCost: '1500',
    tax: '1000',
    total: '11000',
    shippingAddressId: 'addr-1',
    billingAddressId: 'addr-1',
    customerName: 'Jean Dupont',
    customerEmail: 'jean.dupont@email.com',
    customerPhone: '+237 6 XX XX XX XX',
    notes: null,
    trackingNumber: 'TRK-20241010-002',
    items: [
      {
        id: 'item-4',
        orderId: '4',
        productId: 'prod-4',
        productName: 'Clavier mécanique RGB',
        productReference: 'LOGI-MX-KEYS',
        productImageUrl: 'https://via.placeholder.com/150',
        quantity: 1,
        unitPrice: '8500',
        subtotal: '8500',
        createdAt: '2024-10-10T16:45:00Z',
        updatedAt: '2024-10-10T16:45:00Z',
      },
    ],
    paidAt: '2024-10-11T14:30:00Z',
    shippedAt: '2024-10-11T15:00:00Z',
    deliveredAt: '2024-10-12T11:30:00Z',
    cancelledAt: null,
    createdAt: '2024-10-10T16:45:00Z',
    updatedAt: '2024-10-12T11:30:00Z',
  },
  {
    id: '5',
    userId: 'user-1',
    orderNumber: 'ORD-20241009-0005',
    status: 'cancelled' as OrderStatus,
    paymentMethod: 'orange_money' as PaymentMethod,
    paymentStatus: 'refunded' as PaymentStatus,
    paymentReference: 'OM-20241009-DEF456',
    subtotal: '12000',
    shippingCost: '2000',
    tax: '1400',
    total: '15400',
    shippingAddressId: 'addr-1',
    billingAddressId: 'addr-1',
    customerName: 'Jean Dupont',
    customerEmail: 'jean.dupont@email.com',
    customerPhone: '+237 6 XX XX XX XX',
    notes: 'Commande annulée à la demande du client',
    trackingNumber: null,
    items: [
      {
        id: 'item-5',
        orderId: '5',
        productId: 'prod-5',
        productName: 'Souris gaming Razer',
        productReference: 'RAZER-DEATHADDER',
        productImageUrl: 'https://via.placeholder.com/150',
        quantity: 1,
        unitPrice: '12000',
        subtotal: '12000',
        createdAt: '2024-10-09T13:20:00Z',
        updatedAt: '2024-10-09T13:20:00Z',
      },
    ],
    paidAt: '2024-10-09T13:25:00Z',
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: '2024-10-09T15:45:00Z',
    createdAt: '2024-10-09T13:20:00Z',
    updatedAt: '2024-10-09T15:45:00Z',
  },
];

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: mockOrders, // Initialize with mock data for development
  currentOrder: null,
  isLoading: false,
  error: null,

  // Actions
  fetchOrders: async () => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({
        orders: mockOrders,
        isLoading: false,
        error: null,
      });
      return;

      // const response = await shopService.getOrders();

      // if (response.error) {
      //   set({
      //     error: response.error.message,
      //     isLoading: false
      //   });
      //   return;
      // }

      // if (response.data?.orders) {
      //   set({
      //     orders: response.data.orders.data,
      //     isLoading: false,
      //     error: null
      //   });
      // }
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
      await new Promise((resolve) => setTimeout(resolve, 300));
      const mockOrder = mockOrders.find((order) => order.id === orderId);

      console.log(mockOrder);

      if (mockOrder) {
        set({
          currentOrder: mockOrder,
          isLoading: false,
          error: null,
        });
      } else {
        const errorMessage = 'Order not found';
        set({
          error: errorMessage,
          isLoading: false,
        });
        throw new Error(errorMessage);
      }

      // const response = await shopService.getOrder(orderId);

      // if (response.error) {
      //   set({
      //     error: response.error.message,
      //     isLoading: false
      //   });
      //   return;
      // }

      // if (response.data) {
      //   set({
      //     currentOrder: response.data,
      //     isLoading: false,
      //     error: null
      //   });
      // }
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
        const order = Object.values(response.data)[0];

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
        const updatedCurrentOrder = currentOrder?.id === orderId ? cancelledOrder : currentOrder;

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

  // Development utility methods
  loadMockData: () => {
    set({
      orders: mockOrders,
      currentOrder: null,
      isLoading: false,
      error: null,
    });
  },

  addMockOrder: (order: Order) => {
    const { orders } = get();
    set({
      orders: [order, ...orders],
    });
  },
}));
