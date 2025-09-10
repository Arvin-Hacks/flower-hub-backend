import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error';
import { AuthenticatedRequest } from '../types';
import { ensureUser } from '../middleware/auth';

export const userController = {
  // Get user profile
  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.getUserById(ensureUser(req));
    sendSuccess(res, user, 'User profile retrieved');
  }),

  // Update user profile
  updateProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.updateUser(ensureUser(req), req.body);
    sendSuccess(res, user, 'Profile updated successfully');
  }),

  // Delete user account
  deleteAccount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await userService.deleteUser(ensureUser(req));
    sendSuccess(res, null, 'Account deleted successfully');
  }),

  // Get user addresses
  getAddresses: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const addresses = await userService.getUserAddresses(ensureUser(req));
    sendSuccess(res, addresses, 'Addresses retrieved');
  }),

  // Create address
  createAddress: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const address = await userService.createAddress(ensureUser(req), req.body);
    sendSuccess(res, address, 'Address created successfully', 201);
  }),

  // Update address
  updateAddress: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { addressId } = req.params;
    const address = await userService.updateAddress(ensureUser(req), addressId as string, req.body);
    sendSuccess(res, address, 'Address updated successfully');
  }),

  // Delete address
  deleteAddress: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { addressId } = req.params;
    await userService.deleteAddress(ensureUser(req), addressId as string);
    sendSuccess(res, null, 'Address deleted successfully');
  }),

  // Admin: Get all users
  getUsers: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, sortBy, sortOrder } = req.query;
    const users = await userService.getUsers({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sortBy: sortBy as string || 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc' || 'desc',
    });
    sendSuccess(res, users, 'Users retrieved');
  }),

  // Admin: Get user by ID
  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = await userService.getUserById(userId as string);
    sendSuccess(res, user, 'User retrieved');
  }),

  // Admin: Create user
  createUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);
    sendSuccess(res, user, 'User created successfully', 201);
  }),

  // Admin: Update user
  updateUser: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = await userService.updateUser(userId as string, req.body);
    sendSuccess(res, user, 'User updated successfully');
  }),

  // Admin: Delete user
  deleteUser: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    await userService.deleteUser(userId as string);
    sendSuccess(res, null, 'User deleted successfully');
  }),

  // Admin: Get user statistics
  getUserStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await userService.getUserStats();
    sendSuccess(res, stats, 'User statistics retrieved');
  }),
};
