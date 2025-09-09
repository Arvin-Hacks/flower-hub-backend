import { Router } from 'express';
import { orderController } from '@/controllers/order.controller';
import { validate } from '@/utils/validation';
import { commonSchemas } from '@/utils/validation';
import Joi from 'joi';
import { authenticate, adminOnly } from '@/middleware/auth';
import { validateParams } from '@/utils/validation';

const router = Router();

// Validation schemas
const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: commonSchemas.id,
      quantity: Joi.number().integer().min(1).required(),
      selectedColor: Joi.string().allow(null, '').optional(),
      selectedSize: Joi.string().allow(null, '').optional(),
    })
  ).min(1).required(),
  shippingAddress: Joi.object({
    type: Joi.string().valid('shipping', 'SHIPPING').required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string().optional(),
    isDefault: Joi.boolean().optional(),
  }).unknown(false).required(), // unknown(false) prevents additional fields like 'id'
  billingAddress: Joi.object({
    type: Joi.string().valid('billing', 'BILLING').required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string().optional(),
    isDefault: Joi.boolean().optional(),
  }).unknown(false).required(), // unknown(false) prevents additional fields like 'id'
  // paymentMethod: Joi.string().valid('card', 'paypal', 'apple_pay', 'google_pay', 'stripe', 'CASH_ON_DELIVERY').optional(),
  notes: Joi.string().max(500).allow('').optional(),
  couponCode: Joi.string().optional(),
});

const updateOrderSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded').optional(),
  trackingNumber: Joi.string().optional(),
  estimatedDelivery: Joi.date().optional(),
  notes: Joi.string().max(500).optional(),
});

const createCouponSchema = Joi.object({
  code: Joi.string().min(3).max(20).required(),
  description: Joi.string().min(10).max(200).required(),
  type: Joi.string().valid('percentage', 'fixed').required(),
  value: Joi.number().positive().required(),
  minimumAmount: Joi.number().positive().optional(),
  maximumDiscount: Joi.number().positive().optional(),
  usageLimit: Joi.number().integer().min(1).optional(),
  validFrom: Joi.date().required(),
  validUntil: Joi.date().required(),
  applicableProducts: Joi.array().items(commonSchemas.id).optional(),
  applicableCategories: Joi.array().items(commonSchemas.id).optional(),
});

const updateCouponSchema = Joi.object({
  description: Joi.string().min(10).max(200).optional(),
  type: Joi.string().valid('percentage', 'fixed').optional(),
  value: Joi.number().positive().optional(),
  minimumAmount: Joi.number().positive().optional(),
  maximumDiscount: Joi.number().positive().optional(),
  usageLimit: Joi.number().integer().min(1).optional(),
  isActive: Joi.boolean().optional(),
  validFrom: Joi.date().optional(),
  validUntil: Joi.date().optional(),
  applicableProducts: Joi.array().items(commonSchemas.id).optional(),
  applicableCategories: Joi.array().items(commonSchemas.id).optional(),
});

const idSchema = Joi.object({
  orderId: commonSchemas.id,
});

const couponIdSchema = Joi.object({
  couponId: commonSchemas.id,
});

const orderNumberSchema = Joi.object({
  orderNumber: Joi.string().required(),
});

const couponCodeSchema = Joi.object({
  code: Joi.string().required(),
});

// User routes (authenticated)
router.get('/my-orders', authenticate, orderController.getUserOrders);
router.get('/:orderId', authenticate, validateParams(idSchema), orderController.getOrderById);
router.get('/number/:orderNumber', authenticate, validateParams(orderNumberSchema), orderController.getOrderByNumber);
router.post('/', authenticate, validate(createOrderSchema), orderController.createOrder);
router.put('/:orderId/cancel', authenticate, validateParams(idSchema), orderController.cancelOrder);

// Public routes
router.get('/coupons', orderController.getCoupons);
router.get('/coupons/:code', validateParams(couponCodeSchema), orderController.getCouponByCode);

// Admin routes
router.get('/admin/orders', authenticate, adminOnly, orderController.getOrders);
router.put('/admin/orders/:orderId', authenticate, adminOnly, validateParams(idSchema), validate(updateOrderSchema), orderController.updateOrder);
router.get('/admin/summary', authenticate, adminOnly, orderController.getOrderSummary);

router.post('/admin/coupons', authenticate, adminOnly, validate(createCouponSchema), orderController.createCoupon);
router.put('/admin/coupons/:couponId', authenticate, adminOnly, validateParams(couponIdSchema), validate(updateCouponSchema), orderController.updateCoupon);
router.delete('/admin/coupons/:couponId', authenticate, adminOnly, validateParams(couponIdSchema), orderController.deleteCoupon);

export default router;
