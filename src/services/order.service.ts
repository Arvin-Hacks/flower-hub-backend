import { prisma } from '@/database';
import { 
  Order, 
  CreateOrderRequest, 
  UpdateOrderRequest,
  OrderFilters,
  OrderSummary,
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
  PaginationParams,
  PaginatedResponse
} from '@/types';
import { AppError } from '@/middleware/error';
import { calculatePagination, generateOrderNumber, calculateTax, calculateShipping } from '@/utils/helpers';
import { logger } from '@/utils/logger';

export const orderService = {
  // Get all orders
  async getOrders(filters: OrderFilters, params: PaginationParams): Promise<PaginatedResponse<Order>> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = params;

    const { offset } = calculatePagination(page, limit, 0);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) (where as any).createdAt = { gte: filters.dateFrom };
      if (filters.dateTo) (where as any).createdAt = { ...(where as any).createdAt, lte: filters.dateTo };
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { 
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ]
        }},
      ];
    }

    // Build order by clause
    let orderBy: Record<string, string> = { [sortBy]: sortOrder };
    if (sortBy === 'createdAt_asc') orderBy = { createdAt: 'asc' };
    if (sortBy === 'createdAt_desc') orderBy = { createdAt: 'desc' };
    if (sortBy === 'total_asc') orderBy = { total: 'asc' };
    if (sortBy === 'total_desc') orderBy = { total: 'desc' };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: orders as Order[],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order as Order;
  },

  // Get order by order number
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order as Order;
  },

  // Create order
  async createOrder(userId: string, data: CreateOrderRequest): Promise<Order> {
    const { items, shippingAddress, billingAddress, notes, couponCode } = data;

    // Create addresses in database
    const { id: shippingId, ...shippingData } = shippingAddress;
    const { id: billingId, ...billingData } = billingAddress;
    
    const [createdShippingAddress, createdBillingAddress] = await Promise.all([
      prisma.address.create({
        data: {
          ...shippingData,
          type: 'SHIPPING', // Convert to uppercase enum value
          userId,
        },
      }),
      prisma.address.create({
        data: {
          ...billingData,
          type: 'BILLING', // Convert to uppercase enum value
          userId,
        },
      }),
    ]);

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new AppError(`Product with ID ${item.productId} not found`, 404);
      }

      if (!product.inStock || product.stockCount < item.quantity) {
        throw new AppError(`Insufficient stock for product ${product.name}`, 400);
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        selectedColor: item.selectedColor || null,
        selectedSize: item.selectedSize || null,
      });
    }

    // Calculate shipping and tax
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal + shipping);
    
    // Apply coupon if provided
    let discount = 0;
    if (couponCode) {
      const coupon = await this.validateCoupon(couponCode, subtotal);
      if (coupon) {
        if (coupon.type === 'percentage') {
          discount = (subtotal * coupon.value) / 100;
          if (coupon.maximumDiscount) {
            discount = Math.min(discount, coupon.maximumDiscount);
          }
        } else {
          discount = coupon.value;
        }
      }
    }

    const total = subtotal + shipping + tax - discount;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        subtotal,
        shipping,
        tax,
        discount,
        total,
        status: 'PENDING' as any,
        paymentMethod: 'CASH_ON_DELIVERY' as any, // Default payment method
        paymentStatus: 'PENDING' as any,
        notes,
        shippingAddressId: createdShippingAddress.id,
        billingAddressId: createdBillingAddress.id,
        items: {
          create: orderItems,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockCount: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Update coupon usage if applied
    if (couponCode) {
      await prisma.coupon.update({
        where: { code: couponCode },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });
    }

    logger.info('Order created', { orderId: order.id, orderNumber: order.orderNumber, userId });

    return order as Order;
  },

  // Update order (admin only)
  async updateOrder(orderId: string, data: UpdateOrderRequest): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    logger.info('Order updated', { orderId, orderNumber: order.orderNumber });

    return updatedOrder as Order;
  },

  // Cancel order
  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === 'CANCELLED') {
      throw new AppError('Order is already cancelled', 400);
    }

    if (order.status === 'DELIVERED') {
      throw new AppError('Cannot cancel delivered order', 400);
    }

    // Restore product stock
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockCount: {
            increment: item.quantity,
          },
        },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    logger.info('Order cancelled', { orderId, orderNumber: order.orderNumber, userId });

    return updatedOrder as Order;
  },

  // Get order summary (admin only)
  async getOrderSummary(): Promise<OrderSummary> {
    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
    ]);

    const averageOrderValue = totalOrders > 0 ? (totalRevenue._sum.total?.toNumber() || 0) / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total?.toNumber() || 0,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      averageOrderValue,
    };
  },

  // Get all coupons (admin only)
  async getCoupons(): Promise<Coupon[]> {
    return prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    }) as Promise<Coupon[]>;
  },

  // Get coupon by code
  async getCouponByCode(code: string): Promise<Coupon> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    return coupon as Coupon;
  },

  // Create coupon (admin only)
  async createCoupon(data: CreateCouponRequest): Promise<Coupon> {
    const code = data.code.toUpperCase();

    // Check if coupon already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      throw new AppError('Coupon with this code already exists', 409);
    }

    const coupon = await prisma.coupon.create({
      data: {
        ...data,
        code,
      },
    });

    logger.info('Coupon created', { couponId: coupon.id, code });

    return coupon as Coupon;
  },

  // Update coupon (admin only)
  async updateCoupon(couponId: string, data: UpdateCouponRequest): Promise<Coupon> {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data,
    });

    logger.info('Coupon updated', { couponId, code: coupon.code });

    return updatedCoupon as Coupon;
  },

  // Delete coupon (admin only)
  async deleteCoupon(couponId: string): Promise<void> {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    await prisma.coupon.delete({
      where: { id: couponId },
    });

    logger.info('Coupon deleted', { couponId, code: coupon.code });
  },

  // Validate coupon (private helper)
  async validateCoupon(code: string, amount: number): Promise<Coupon | null> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return null;
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return null;
    }

    // Check if coupon is within valid date range
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return null;
    }

    // Check minimum amount
    if (coupon.minimumAmount && amount < coupon.minimumAmount.toNumber()) {
      return null;
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return null;
    }

    return coupon as Coupon;
  },
};
