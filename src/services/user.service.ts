import { prisma } from '@/database';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  CreateAddressRequest, 
  UpdateAddressRequest,
  PaginationParams,
  PaginatedResponse
} from '@/types';
import { AppError } from '@/middleware/error';
import { calculatePagination } from '@/utils/helpers';
import { logger } from '@/utils/logger';

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

  // Get all users (admin only)
  async getUsers(params: PaginationParams): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    
    const { offset, totalPages } = calculatePagination(page, limit, 0);
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          addresses: true,
        },
      }),
      prisma.user.count(),
    ]);

    return {
      items: users.map((user: any) => ({
        ...user,
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
    return prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Create address
  async createAddress(userId: string, data: CreateAddressRequest) {
    const { isDefault, ...addressData } = data;

    // If this is set as default, unset other default addresses of the same type
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          type: data.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        type: addressData.type as any,
        userId,
        isDefault: isDefault || false,
      },
    });

    logger.info('Address created', { userId, addressId: address.id });

    return address;
  },

  // Update address
  async updateAddress(userId: string, addressId: string, data: UpdateAddressRequest) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    const { isDefault, ...addressData } = data;

    // If this is set as default, unset other default addresses of the same type
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          type: address.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        ...addressData,
        ...(addressData.type && { type: addressData.type as any }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    logger.info('Address updated', { userId, addressId });

    return updatedAddress;
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
      totalUsers,
      verifiedUsers,
      newUsersThisMonth,
      activeUsers,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
    };
  },
};
