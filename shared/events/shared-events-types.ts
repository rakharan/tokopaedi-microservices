// shared/events/types.ts
// Event Type Definitions for Tokopaedi Microservices

// ============================================
// User Service Events
// ============================================

export interface UserCreatedEvent {
  eventType: 'user.created';
  timestamp: number;
  data: {
    userId: number;
    email: string;
    name: string;
    level: number;
  };
}

export interface UserUpdatedEvent {
  eventType: 'user.updated';
  timestamp: number;
  data: {
    userId: number;
    email?: string;
    name?: string;
    level?: number;
  };
}

export interface UserDeletedEvent {
  eventType: 'user.deleted';
  timestamp: number;
  data: {
    userId: number;
  };
}

export interface UserVerifiedEvent {
  eventType: 'user.verified';
  timestamp: number;
  data: {
    userId: number;
    email: string;
  };
}

// ============================================
// Product Service Events
// ============================================

export interface ProductCreatedEvent {
  eventType: 'product.created';
  timestamp: number;
  data: {
    productId: number;
    name: string;
    price: number;
    stock: number;
    category: number;
  };
}

export interface ProductUpdatedEvent {
  eventType: 'product.updated';
  timestamp: number;
  data: {
    productId: number;
    changes: {
      name?: string;
      price?: number;
      stock?: number;
      category?: number;
    };
  };
}

export interface ProductDeletedEvent {
  eventType: 'product.deleted';
  timestamp: number;
  data: {
    productId: number;
  };
}

export interface ProductStockDecreasedEvent {
  eventType: 'product.stock.decreased';
  timestamp: number;
  data: {
    productId: number;
    quantity: number;
    newStock: number;
    orderId: number; // for idempotency
  };
}

export interface ProductStockIncreasedEvent {
  eventType: 'product.stock.increased';
  timestamp: number;
  data: {
    productId: number;
    quantity: number;
    newStock: number;
    reason: 'cancellation' | 'return' | 'adjustment';
  };
}

export interface ProductReviewCreatedEvent {
  eventType: 'product.review.created';
  timestamp: number;
  data: {
    reviewId: number;
    productId: number;
    userId: number;
    rating: number;
    comment: string;
  };
}

// ============================================
// Order Service Events
// ============================================

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface OrderCreatedEvent {
  eventType: 'order.created';
  timestamp: number;
  data: {
    orderId: number;
    userId: number;
    items: OrderItem[];
    itemsPrice: number;
    shippingPrice: number;
    totalPrice: number;
    shippingAddressId: number;
    expireAt: number;
  };
}

export interface OrderCancelledEvent {
  eventType: 'order.cancelled';
  timestamp: number;
  data: {
    orderId: number;
    userId: number;
    items: OrderItem[];
    reason: string;
  };
}

export interface OrderPaymentPendingEvent {
  eventType: 'order.payment.pending';
  timestamp: number;
  data: {
    orderId: number;
    userId: number;
    amount: number;
    expireAt: number;
  };
}

export interface OrderPaymentCompletedEvent {
  eventType: 'order.payment.completed';
  timestamp: number;
  data: {
    orderId: number;
    userId: number;
    paidAt: number;
    paymentMethod: string;
  };
}

export interface OrderCompletedEvent {
  eventType: 'order.completed';
  timestamp: number;
  data: {
    orderId: number;
    userId: number;
    completedAt: number;
  };
}

export interface OrderFailedEvent {
  eventType: 'order.failed';
  timestamp: number;
  data: {
    orderId: number;
    userId: number;
    reason: string;
    failureType: 'stock_unavailable' | 'payment_failed' | 'system_error';
  };
}

// ============================================
// Payment Service Events
// ============================================

export interface PaymentPendingEvent {
  eventType: 'payment.pending';
  timestamp: number;
  data: {
    paymentId: number;
    orderId: number;
    userId: number;
    amount: number;
    paymentMethod: string;
  };
}

export interface PaymentCompletedEvent {
  eventType: 'payment.completed';
  timestamp: number;
  data: {
    paymentId: number;
    orderId: number;
    userId: number;
    amount: number;
    paymentMethod: string;
    paidAt: number;
    gatewayTransactionId: string;
  };
}

export interface PaymentFailedEvent {
  eventType: 'payment.failed';
  timestamp: number;
  data: {
    paymentId: number;
    orderId: number;
    userId: number;
    reason: string;
    gatewayResponse: any;
  };
}

export interface PaymentRefundedEvent {
  eventType: 'payment.refunded';
  timestamp: number;
  data: {
    paymentId: number;
    orderId: number;
    userId: number;
    amount: number;
    refundedAt: number;
  };
}

// ============================================
// Delivery Service Events
// ============================================

export interface DeliveryCreatedEvent {
  eventType: 'delivery.created';
  timestamp: number;
  data: {
    deliveryId: number;
    orderId: number;
    userId: number;
    expeditionName: string;
    shippingAddress: {
      address: string;
      city: string;
      province: string;
      postalCode: string;
    };
  };
}

export interface DeliveryShippedEvent {
  eventType: 'delivery.shipped';
  timestamp: number;
  data: {
    deliveryId: number;
    orderId: number;
    userId: number;
    trackingNumber: string;
    shippedAt: number;
  };
}

export interface DeliveryInTransitEvent {
  eventType: 'delivery.in_transit';
  timestamp: number;
  data: {
    deliveryId: number;
    orderId: number;
    currentLocation: string;
  };
}

export interface DeliveryDeliveredEvent {
  eventType: 'delivery.delivered';
  timestamp: number;
  data: {
    deliveryId: number;
    orderId: number;
    userId: number;
    deliveredAt: number;
    recipientName: string;
  };
}

export interface DeliveryCancelledEvent {
  eventType: 'delivery.cancelled';
  timestamp: number;
  data: {
    deliveryId: number;
    orderId: number;
    reason: string;
  };
}

// ============================================
// Notification Service Events
// ============================================

export interface NotificationSentEvent {
  eventType: 'notification.sent';
  timestamp: number;
  data: {
    notificationId: number;
    userId: number;
    type: 'email' | 'sms';
    template: string;
    success: boolean;
  };
}

export interface NotificationFailedEvent {
  eventType: 'notification.failed';
  timestamp: number;
  data: {
    userId: number;
    type: 'email' | 'sms';
    template: string;
    reason: string;
  };
}

// ============================================
// Union Type for All Events
// ============================================

export type DomainEvent =
  // User Events
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | UserVerifiedEvent
  // Product Events
  | ProductCreatedEvent
  | ProductUpdatedEvent
  | ProductDeletedEvent
  | ProductStockDecreasedEvent
  | ProductStockIncreasedEvent
  | ProductReviewCreatedEvent
  // Order Events
  | OrderCreatedEvent
  | OrderCancelledEvent
  | OrderPaymentPendingEvent
  | OrderPaymentCompletedEvent
  | OrderCompletedEvent
  | OrderFailedEvent
  // Payment Events
  | PaymentPendingEvent
  | PaymentCompletedEvent
  | PaymentFailedEvent
  | PaymentRefundedEvent
  // Delivery Events
  | DeliveryCreatedEvent
  | DeliveryShippedEvent
  | DeliveryInTransitEvent
  | DeliveryDeliveredEvent
  | DeliveryCancelledEvent
  // Notification Events
  | NotificationSentEvent
  | NotificationFailedEvent;

// ============================================
// Event Routing Keys (for RabbitMQ)
// ============================================

export const EventRoutingKeys = {
  // User Service
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_VERIFIED: 'user.verified',

  // Product Service
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_STOCK_DECREASED: 'product.stock.decreased',
  PRODUCT_STOCK_INCREASED: 'product.stock.increased',
  PRODUCT_REVIEW_CREATED: 'product.review.created',

  // Order Service
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_PAYMENT_PENDING: 'order.payment.pending',
  ORDER_PAYMENT_COMPLETED: 'order.payment.completed',
  ORDER_COMPLETED: 'order.completed',
  ORDER_FAILED: 'order.failed',

  // Payment Service
  PAYMENT_PENDING: 'payment.pending',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Delivery Service
  DELIVERY_CREATED: 'delivery.created',
  DELIVERY_SHIPPED: 'delivery.shipped',
  DELIVERY_IN_TRANSIT: 'delivery.in_transit',
  DELIVERY_DELIVERED: 'delivery.delivered',
  DELIVERY_CANCELLED: 'delivery.cancelled',

  // Notification Service
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_FAILED: 'notification.failed',
} as const;

// ============================================
// Exchange Names
// ============================================

export const ExchangeNames = {
  USER_EVENTS: 'user.events',
  PRODUCT_EVENTS: 'product.events',
  ORDER_EVENTS: 'order.events',
  PAYMENT_EVENTS: 'payment.events',
  DELIVERY_EVENTS: 'delivery.events',
  NOTIFICATION_EVENTS: 'notification.events',
} as const;

// ============================================
// Queue Names
// ============================================

export const QueueNames = {
  // User Service Queues
  USER_SERVICE: 'user.service.queue',

  // Product Service Queues
  PRODUCT_SERVICE: 'product.service.queue',
  PRODUCT_ORDER_EVENTS: 'product.order.events.queue',

  // Order Service Queues
  ORDER_SERVICE: 'order.service.queue',
  ORDER_PAYMENT_EVENTS: 'order.payment.events.queue',
  ORDER_DELIVERY_EVENTS: 'order.delivery.events.queue',

  // Payment Service Queues
  PAYMENT_SERVICE: 'payment.service.queue',
  PAYMENT_ORDER_EVENTS: 'payment.order.events.queue',

  // Delivery Service Queues
  DELIVERY_SERVICE: 'delivery.service.queue',
  DELIVERY_ORDER_EVENTS: 'delivery.order.events.queue',

  // Notification Service Queues
  NOTIFICATION_SERVICE: 'notification.service.queue',
  NOTIFICATION_ALL_EVENTS: 'notification.all.events.queue',
} as const;
