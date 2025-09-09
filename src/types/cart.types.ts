import { BaseEntity } from './common.types';
import { Product } from './product.types';

export interface CartItem extends BaseEntity {
  userId: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface WishlistItem extends BaseEntity {
  userId: string;
  productId: string;
  product: Product;
}

export interface AddToWishlistRequest {
  productId: string;
}
