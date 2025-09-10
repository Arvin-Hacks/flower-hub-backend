import { Request, Response } from 'express';
import { orderService } from '@/services/order.service';
import { sendSuccess, sendError } from '@/utils/response';
import { asyncHandler } from '@/middleware/error';
import { AuthenticatedRequest, OrderFilters } from '@/types';
import { ensureUser } from '@/middleware/auth';

export const orderController = {
  // Get user's orders
  getUserOrders: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, sortBy, sortOrder, status, paymentStatus } = req.query;
    
    const filters = {
      userId: ensureUser(req),
      status: status as string,
      paymentStatus: paymentStatus as string,
    };

    const params = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sortBy: sortBy as string || 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc' || 'desc',
    };

    const orders = await orderService.getOrders(filters as OrderFilters, params);
    sendSuccess(res, orders, 'Orders retrieved');
  }),

  // Get order by ID
  getOrderById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.params;
    const order = await orderService.getOrderById(orderId as string);
    
    // Check if user owns this order or is admin
    if (order.userId !== ensureUser(req) && req.user?.role === 'user') {
      return sendError(res, 'Access denied', 403);
    }
    
    sendSuccess(res, order, 'Order retrieved');
  }),

  // Get order by order number
  getOrderByNumber: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(orderNumber as string);
    
    // Check if user owns this order or is admin
    if (order.userId !== ensureUser(req) && req.user?.role === 'user') {
      return sendError(res, 'Access denied', 403);
    }
    
    sendSuccess(res, order, 'Order retrieved');
  }),

  // Create order
  createOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const order = await orderService.createOrder(ensureUser(req), req.body);
    console.log(order);
    return res.status(201).json({message: 'Order created successfully', order});
    // sendSuccess(res, order, 'Order created successfully', 201);
  }),

  // Cancel order
  cancelOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.params;
    const order = await orderService.cancelOrder(ensureUser(req), orderId as string);
    sendSuccess(res, order, 'Order cancelled successfully');
  }),

  // Admin: Get all orders
  getOrders: asyncHandler(async (req: Request, res: Response) => {
    const { 
      page, 
      limit, 
      sortBy, 
      sortOrder,
      status,
      paymentStatus,
      userId,
      dateFrom,
      dateTo,
      search
    } = req.query;

    const filters = {
      status: status as string,
      paymentStatus: paymentStatus as string,
      userId: userId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      search: search as string,
    };

    const params = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sortBy: sortBy as string || 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc' || 'desc',
    };

    const orders = await orderService.getOrders(filters as OrderFilters, params);
    sendSuccess(res, orders, 'Orders retrieved');
  }),

  // Admin: Update order
  updateOrder: asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const order = await orderService.updateOrder(orderId as string, req.body);
    sendSuccess(res, order, 'Order updated successfully');
  }),

  // Admin: Get order summary
  getOrderSummary: asyncHandler(async (req: Request, res: Response) => {
    const summary = await orderService.getOrderSummary();
    sendSuccess(res, summary, 'Order summary retrieved');
  }),

  // Get all coupons
  getCoupons: asyncHandler(async (req: Request, res: Response) => {
    const coupons = await orderService.getCoupons();
    sendSuccess(res, coupons, 'Coupons retrieved');
  }),

  // Get coupon by code
  getCouponByCode: asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;
    const coupon = await orderService.getCouponByCode(code as string);
    sendSuccess(res, coupon, 'Coupon retrieved');
  }),

  // Admin: Create coupon
  createCoupon: asyncHandler(async (req: Request, res: Response) => {
    const coupon = await orderService.createCoupon(req.body);
    sendSuccess(res, coupon, 'Coupon created successfully', 201);
  }),

  // Admin: Update coupon
  updateCoupon: asyncHandler(async (req: Request, res: Response) => {
    const { couponId } = req.params;
    const coupon = await orderService.updateCoupon(couponId as string, req.body);
    sendSuccess(res, coupon, 'Coupon updated successfully');
  }),

  // Admin: Delete coupon
  deleteCoupon: asyncHandler(async (req: Request, res: Response) => {
    const { couponId } = req.params;
    await orderService.deleteCoupon(couponId as string);
    sendSuccess(res, null, 'Coupon deleted successfully');
  }),
};
