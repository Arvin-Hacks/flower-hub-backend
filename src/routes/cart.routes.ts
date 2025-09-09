import { Router } from 'express';
import { cartController } from '@/controllers/cart.controller';
import { validate } from '@/utils/validation';
import { commonSchemas } from '@/utils/validation';
import Joi from 'joi';
import { authenticate } from '@/middleware/auth';
import { validateParams } from '@/utils/validation';

const router = Router();

// Validation schemas
const addToCartSchema = Joi.object({
  productId: commonSchemas.id,
  quantity: Joi.number().integer().min(1).required(),
  selectedColor: Joi.string().optional(),
  selectedSize: Joi.string().optional(),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
  selectedColor: Joi.string().optional(),
  selectedSize: Joi.string().optional(),
});

const addToWishlistSchema = Joi.object({
  productId: commonSchemas.id,
});

const moveToCartSchema = Joi.object({
  quantity: Joi.number().integer().min(1).default(1),
});

const cartItemIdSchema = Joi.object({
  cartItemId: commonSchemas.id,
});

const wishlistItemIdSchema = Joi.object({
  wishlistItemId: commonSchemas.id,
});

// Cart routes (all require authentication)
router.get('/', authenticate, cartController.getCart);
router.post('/add', authenticate, validate(addToCartSchema), cartController.addToCart);
router.put('/items/:cartItemId', authenticate, validateParams(cartItemIdSchema), validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/items/:cartItemId', authenticate, validateParams(cartItemIdSchema), cartController.removeFromCart);
router.delete('/clear', authenticate, cartController.clearCart);
router.get('/count', authenticate, cartController.getCartItemCount);

// Wishlist routes (all require authentication)
router.get('/wishlist', authenticate, cartController.getWishlist);
router.post('/wishlist/add', authenticate, validate(addToWishlistSchema), cartController.addToWishlist);
router.delete('/wishlist/:wishlistItemId', authenticate, validateParams(wishlistItemIdSchema), cartController.removeFromWishlist);
router.post('/wishlist/:wishlistItemId/move-to-cart', authenticate, validateParams(wishlistItemIdSchema), validate(moveToCartSchema), cartController.moveToCart);
router.get('/wishlist/count', authenticate, cartController.getWishlistItemCount);

export default router;
