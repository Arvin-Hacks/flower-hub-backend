import { prisma } from '../database';
import { 
  Cart, 
  CartItem, 
  AddToCartRequest, 
  UpdateCartItemRequest,
  WishlistItem,
  AddToWishlistRequest
} from '../types';
import { AppError } from '../middleware/error';
import { calculateTax, calculateShipping } from '../utils/helpers';
import { logger } from '../utils/logger';

export const cartService = {
  // Get user's cart
  async getCart(userId: string): Promise<Cart> {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const subtotal = cartItems.reduce((sum: number, item: any) => {
      return sum + (Number(item.product.price)) * item.quantity;
    }, 0);

    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal + shipping);
    const total = subtotal + shipping + tax;
    const itemCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

    return {
      items: cartItems as CartItem[],
      subtotal,
      shipping,
      tax,
      discount: 0,
      total,
      itemCount,
    };
  },

  // Add item to cart
  async addToCart(userId: string, data: AddToCartRequest): Promise<CartItem> {
    const { productId, quantity, selectedColor, selectedSize } = data;

    // Check if product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (!product.inStock) {
      throw new AppError('Product is out of stock', 400);
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stockCount) {
        throw new AppError('Insufficient stock', 400);
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });

      logger.info('Cart item quantity updated', { 
        userId, 
        cartItemId: updatedItem.id, 
        productId, 
        quantity: newQuantity 
      });

      return updatedItem as CartItem;
    } else {
      // Create new cart item
      if (quantity > product.stockCount) {
        throw new AppError('Insufficient stock', 400);
      }

      const cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          selectedColor: selectedColor || null,
          selectedSize: selectedSize || null,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });

      logger.info('Item added to cart', { 
        userId, 
        cartItemId: cartItem.id, 
        productId, 
        quantity 
      });

      return cartItem as CartItem;
    }
  },

  // Update cart item
  async updateCartItem(userId: string, cartItemId: string, data: UpdateCartItemRequest): Promise<CartItem> {
    const { quantity, selectedColor, selectedSize } = data;

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
      include: { product: true },
    });

    if (!cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    if (quantity <= 0) {
      // Remove item from cart
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });

      logger.info('Item removed from cart', { userId, cartItemId, productId: cartItem.productId });
      throw new AppError('Item removed from cart', 200);
    }

    if (quantity > cartItem.product.stockCount) {
      throw new AppError('Insufficient stock', 400);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity,
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    logger.info('Cart item updated', { userId, cartItemId, productId: cartItem.productId, quantity });

    return updatedItem as CartItem;
  },

  // Remove item from cart
  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
    });

    if (!cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    logger.info('Item removed from cart', { userId, cartItemId, productId: cartItem.productId });
  },

  // Clear cart
  async clearCart(userId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: { userId },
    });

    logger.info('Cart cleared', { userId });
  },

  // Get user's wishlist
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return wishlistItems.map((item:any) => ({
      ...item,
      updatedAt: item.createdAt, // Use createdAt as updatedAt for wishlist items
    })) as WishlistItem[];
  },

  // Add item to wishlist
  async addToWishlist(userId: string, data: AddToWishlistRequest): Promise<WishlistItem> {
    const { productId } = data;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingItem) {
      throw new AppError('Product is already in your wishlist', 409);
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    logger.info('Item added to wishlist', { userId, wishlistItemId: wishlistItem.id, productId });

    return {
      ...wishlistItem,
      updatedAt: wishlistItem.createdAt, // Use createdAt as updatedAt for wishlist items
    } as WishlistItem;
  },

  // Remove item from wishlist
  async removeFromWishlist(userId: string, wishlistItemId: string): Promise<void> {
    const wishlistItem = await prisma.wishlistItem.findFirst({
      where: { id: wishlistItemId, userId },
    });

    if (!wishlistItem) {
      throw new AppError('Wishlist item not found', 404);
    }

    await prisma.wishlistItem.delete({
      where: { id: wishlistItemId },
    });

    logger.info('Item removed from wishlist', { userId, wishlistItemId, productId: wishlistItem.productId });
  },

  // Move item from wishlist to cart
  async moveToCart(userId: string, wishlistItemId: string, quantity = 1): Promise<CartItem> {
    const wishlistItem = await prisma.wishlistItem.findFirst({
      where: { id: wishlistItemId, userId },
      include: { product: true },
    });

    if (!wishlistItem) {
      throw new AppError('Wishlist item not found', 404);
    }

    // Check if product is in stock
    if (!wishlistItem.product.inStock || wishlistItem.product.stockCount < quantity) {
      throw new AppError('Product is out of stock', 400);
    }

    // Add to cart
    const cartItem = await this.addToCart(userId, {
      productId: wishlistItem.productId,
      quantity,
    });

    // Remove from wishlist
    await prisma.wishlistItem.delete({
      where: { id: wishlistItemId },
    });

    logger.info('Item moved from wishlist to cart', { 
      userId, 
      wishlistItemId, 
      cartItemId: cartItem.id, 
      productId: wishlistItem.productId 
    });

    return cartItem;
  },

  // Get cart item count
  async getCartItemCount(userId: string): Promise<number> {
    const result = await prisma.cartItem.aggregate({
      where: { userId },
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
  },

  // Get wishlist item count
  async getWishlistItemCount(userId: string): Promise<number> {
    return prisma.wishlistItem.count({
      where: { userId },
    });
  },
};
