import { BaseEntity } from './common.types';

export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  subcategory: string;
  images: string[];
  colors: string[];
  sizes: string[];
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  features: string[];
  care: string[];
  isActive: boolean;
  isFeatured: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  seoTitle?: string;
  seoDescription?: string;
  slug: string;
}

export interface ProductCategory extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: string;
  parent?: ProductCategory;
  children?: ProductCategory[];
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductReview extends BaseEntity {
  userId: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  helpful: number;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  subcategory: string;
  images: string[];
  colors: string[];
  sizes: string[];
  stockCount: number;
  tags: string[];
  features: string[];
  care: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in';
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  categoryId?: string;
  subcategory?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  stockCount?: number;
  tags?: string[];
  features?: string[];
  care?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in';
  seoTitle?: string;
  seoDescription?: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  priceRange?: [number, number];
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'rating' | 'newest' | 'popular';
  search?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  image: string;
  isActive?: boolean;
  sortOrder?: number;
  parentId?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  parentId?: string;
}

export interface CreateReviewRequest {
  rating: number;
  title: string;
  comment: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
}
