import { prisma } from '../database';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  CreateAddressRequest, 
  UpdateAddressRequest,
  PaginationParams,
  PaginatedResponse
} from '../types';
import { AppError } from '../middleware/error';
import { calculatePagination } from '../utils/helpers';
import { logger } from '../utils/logger';

export const userService = {
  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      ...user,
      addresses: [],
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        currency: 'USD',
        language: 'en',
      },
    } as User;
  },

  // Get detailed customer analytics for admin
  async getCustomerDetails(userId: string) {
    const user: any = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        orders: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: true,
                    price: true,
                  },
                },
              },
            },
            shippingAddress: true,
            billingAddress: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Calculate customer metrics
    const completedOrders = user.orders.filter((order: any) => 
      ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status)
    );
    
    const totalSpent = completedOrders.reduce((sum: number, order: any) => 
      sum + Number(order.total), 0
    );
    
    const averageOrderValue = completedOrders.length > 0 
      ? totalSpent / completedOrders.length 
      : 0;

    // Get order status breakdown
    const ordersByStatus = user.orders.reduce((acc: any, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Get monthly order history (last 12 months)
    const monthlyOrders = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthOrders = user.orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      monthlyOrders.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        orders: monthOrders.length,
        revenue: monthOrders.reduce((sum: number, order: any) => sum + Number(order.total), 0),
      });
    }

    // Get top purchased products
    const productPurchases: any = {};
    user.orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const productId = item.productId;
        if (!productPurchases[productId]) {
          productPurchases[productId] = {
            product: item.product,
            quantity: 0,
            totalSpent: 0,
            orders: 0,
          };
        }
        productPurchases[productId].quantity += item.quantity;
        productPurchases[productId].totalSpent += Number(item.price) * item.quantity;
        productPurchases[productId].orders++;
      });
    });

    const topProducts = Object.values(productPurchases)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Convert addresses to frontend format
    const formattedAddresses = user.addresses.map((address: any) => ({
      ...address,
      type: address.type.toLowerCase() as 'billing' | 'shipping',
    }));

    // Recent activity timeline
    const activities = [
      ...user.orders.map((order: any) => ({
        type: 'order',
        date: order.createdAt,
        description: `Order #${order.orderNumber || order.id.slice(-8)} - ${order.status}`,
        amount: Number(order.total),
        status: order.status,
      })),
      {
        type: 'registration',
        date: user.createdAt,
        description: 'Account created',
        amount: 0,
        status: 'COMPLETED',
      },
      ...(user.isEmailVerified ? [{
        type: 'verification',
        date: user.updatedAt,
        description: 'Email verified',
        amount: 0,
        status: 'COMPLETED',
      }] : []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      user: {
        ...user,
        addresses: formattedAddresses,
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: true,
          currency: 'USD',
          language: 'en',
        },
      },
      analytics: {
        totalOrders: user.orders.length,
        completedOrders: completedOrders.length,
        totalSpent,
        averageOrderValue,
        ordersByStatus,
        monthlyOrders,
        topProducts,
        activities: activities.slice(0, 20), // Last 20 activities
        firstOrderDate: user.orders.length > 0 ? user.orders[user.orders.length - 1].createdAt : null,
        lastOrderDate: user.orders.length > 0 ? user.orders[0].createdAt : null,
        loyaltyScore: Math.min(100, Math.floor((completedOrders.length * 10) + (totalSpent / 100))),
      },
    };
  },

  // Get all users (admin only)
  async getUsers(params: PaginationParams & {
    search?: string;
    role?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search,
      role,
      isActive,
      isEmailVerified,
    } = params;
    
    // Build where clause
    const where: any = {};

    // Add search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add role filter
    if (role) {
      where.role = role;
    }

    // Add email verification filter
    if (isEmailVerified !== undefined) {
      where.isEmailVerified = isEmailVerified;
    }

    // Add active status filter (we'll use a heuristic for this)
    if (isActive !== undefined) {
      if (isActive) {
        // Consider users active if they've been updated in the last 30 days
        where.updatedAt = {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        };
      } else {
        where.updatedAt = {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        };
      }
    }

    const total = await prisma.user.count({ where });
    const { offset, totalPages } = calculatePagination(page, limit, total);
    
    const users = await prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        addresses: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return {
      items: users.map((user: any) => ({
        ...user,
        orderCount: user._count.orders,
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: true,
          currency: 'USD',
          language: 'en',
        },
      })) as User[],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },

  // Create user (admin only)
  async createUser(data: CreateUserRequest): Promise<User> {
    const { email, password, firstName, lastName, role = 'USER' } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password, // Note: In real app, hash this password
        firstName,
        lastName,
        role: role as any,
      },
      include: {
        addresses: true,
      },
    });

    logger.info('User created by admin', { userId: user.id, email: user.email });

    return {
      ...user,
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        currency: 'USD',
        language: 'en',
      },
    } as User;
  },

  // Update user
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const { firstName, lastName, avatar, preferences } = data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(avatar && { avatar }),
      },
      include: {
        addresses: true,
      },
    });

    logger.info('User updated', { userId });

    return {
      ...user,
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        currency: 'USD',
        language: 'en',
        ...preferences,
      },
    } as User;
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info('User deleted', { userId });
  },

  // Get user addresses
  async getUserAddresses(userId: string) {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Convert types to frontend format
    return addresses.map((address: any) => ({
      ...address,
      type: address.type.toLowerCase() as 'billing' | 'shipping',
    }));
  },

  // Create address
  async createAddress(userId: string, data: CreateAddressRequest) {
    const { isDefault, ...addressData } = data;

    // Convert frontend type to backend enum format
    const backendType = data.type.toUpperCase() as 'BILLING' | 'SHIPPING';

    // If this is set as default, unset other default addresses of the same type
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          type: backendType,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        type: backendType,
        userId,
        isDefault: isDefault || false,
      },
    });

    logger.info('Address created', { userId, addressId: address.id });

    // Convert back to frontend format
    return {
      ...address,
      type: address.type.toLowerCase() as 'billing' | 'shipping',
    };
  },

  // Update address
  async updateAddress(userId: string, addressId: string, data: UpdateAddressRequest) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    const { isDefault, type, ...addressData } = data;

    // Convert type if provided
    const backendType = type ? (type.toUpperCase() as 'BILLING' | 'SHIPPING') : undefined;

    // If this is set as default, unset other default addresses of the same type
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          type: backendType || address.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        ...addressData,
        ...(backendType && { type: backendType }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    logger.info('Address updated', { userId, addressId });

    // Convert back to frontend format
    return {
      ...updatedAddress,
      type: updatedAddress.type.toLowerCase() as 'billing' | 'shipping',
    };
  },

  // Delete address
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    logger.info('Address deleted', { userId, addressId });
  },

  // Set default address
  async setDefaultAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    // Unset other default addresses of the same type
    await prisma.address.updateMany({
      where: {
        userId,
        type: address.type,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set this address as default
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    logger.info('Default address set', { userId, addressId });

    // Convert back to frontend format
    return {
      ...updatedAddress,
      type: updatedAddress.type.toLowerCase() as 'billing' | 'shipping',
    };
  },

  // Get user statistics (admin only)
  async getUserStats() {
    const [
      totalUsers,
      verifiedUsers,
      newUsersThisMonth,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isEmailVerified: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      verified: verifiedUsers,
      unverified: totalUsers - verifiedUsers,
      newThisMonth: newUsersThisMonth,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
    };
  },

  // Get customer analytics (admin only)
  async getCustomerAnalytics() {
    const [
      totalCustomers,
      verifiedCustomers,
      newCustomersThisMonth,
      orderStats,
      topCustomersData,
    ] = await Promise.all([
      // Total customers (only USER role)
      prisma.user.count({ where: { role: 'USER' } }),
      
      // Verified customers
      prisma.user.count({ 
        where: { 
          role: 'USER',
          isEmailVerified: true,
        } 
      }),
      
      // New customers this month
      prisma.user.count({
        where: {
          role: 'USER',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Order statistics
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true },
      }),
      
      // Top customers by total spent
      prisma.user.findMany({
        where: { role: 'USER' },
        include: {
          orders: {
            select: {
              total: true,
              status: true,
            },
          },
        },
        take: 10,
      }),
    ]);

    // Calculate top customers
    const topCustomers = topCustomersData
      .map((user: any) => {
        const completedOrders = user.orders.filter((order: any) => 
          ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status)
        );
        const totalSpent = completedOrders.reduce((sum: number, order: any) => 
          sum + Number(order.total), 0
        );
        
        return {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt,
          },
          totalOrders: completedOrders.length,
          totalSpent,
        };
      })
      .filter((customer: any) => customer.totalSpent > 0)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalCustomers,
      activeCustomers: verifiedCustomers,
      averageOrderValue: Number(orderStats._avg.total) || 0,
      totalRevenue: Number(orderStats._sum.total) || 0,
      newCustomersThisMonth,
      topCustomers,
    };
  },
};
