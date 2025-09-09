import { Response } from 'express';
import { cartService } from '@/services/cart.service';
import { sendSuccess } from '@/utils/response';
import { asyncHandler } from '@/middleware/error';
import { AuthenticatedRequest } from '@/types';
import { ensureUser } from '@/middleware/auth';

export const cartController = {
  // Get user's cart
  getCart: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const cart = await cartService.getCart(ensureUser(req));
    sendSuccess(res, cart, 'Cart retrieved');
  }),

  // Add item to cart
  addToCart: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const cartItem = await cartService.addToCart(ensureUser(req), req.body);
    sendSuccess(res, cartItem, 'Item added to cart', 201);
  }),

  // Update cart item
  updateCartItem: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { cartItemId } = req.params;
    try {
      const cartItem = await cartService.updateCartItem(ensureUser(req), cartItemId as string, req.body);
      sendSuccess(res, cartItem, 'Cart item updated');
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Item removed from cart') {
        sendSuccess(res, null, 'Item removed from cart');
      } else {
        throw error;
      }
    }
  }),

  // Remove item from cart
  removeFromCart: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { cartItemId } = req.params;
    await cartService.removeFromCart(ensureUser(req), cartItemId as string);
    sendSuccess(res, null, 'Item removed from cart');
  }),

  // Clear cart
  clearCart: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await cartService.clearCart(ensureUser(req));
    sendSuccess(res, null, 'Cart cleared');
  }),

  // Get cart item count
  getCartItemCount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const count = await cartService.getCartItemCount(ensureUser(req));
    sendSuccess(res, { count }, 'Cart item count retrieved');
  }),

  // Get user's wishlist
  getWishlist: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const wishlist = await cartService.getWishlist(ensureUser(req));
    sendSuccess(res, wishlist, 'Wishlist retrieved');
  }),

  // Add item to wishlist
  addToWishlist: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const wishlistItem = await cartService.addToWishlist(ensureUser(req), req.body);
    sendSuccess(res, wishlistItem, 'Item added to wishlist', 201);
  }),

  // Remove item from wishlist
  removeFromWishlist: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { wishlistItemId } = req.params;
    await cartService.removeFromWishlist(ensureUser(req), wishlistItemId as string);
    sendSuccess(res, null, 'Item removed from wishlist');
  }),

  // Move item from wishlist to cart
  moveToCart: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { wishlistItemId } = req.params;
    const { quantity = 1 } = req.body;
    const cartItem = await cartService.moveToCart(ensureUser(req), wishlistItemId as string, quantity);
    sendSuccess(res, cartItem, 'Item moved to cart');
  }),

  // Get wishlist item count
  getWishlistItemCount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const count = await cartService.getWishlistItemCount(ensureUser(req));
    sendSuccess(res, { count }, 'Wishlist item count retrieved');
  }),
};
