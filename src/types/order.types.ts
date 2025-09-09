import { BaseEntity, OrderStatus, PaymentStatus, PaymentMethod } from './common.types';
import { Product } from './product.types';
import { Address } from './user.types';

export interface Order extends BaseEntity {
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  shippingAddress: Address;
  billingAddress: Address;
  // paymentMethod: PaymentMethod; // Commented out for now
  notes?: string;
  couponCode?: string;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  search?: string;
  sortBy?: 'createdAt_asc' | 'createdAt_desc' | 'total_asc' | 'total_desc';
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

export interface CreateCouponRequest {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  validFrom: Date;
  validUntil: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

export interface UpdateCouponRequest {
  description?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
}
