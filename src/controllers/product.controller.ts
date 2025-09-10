import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error';
import { AuthenticatedRequest, ProductFilters } from '../types';
import { ensureUser } from '../middleware/auth';

export const productController = {
  // Get all products
  getProducts: asyncHandler(async (req: Request, res: Response) => {
    const { 
      page, 
      limit, 
      sortBy, 
      sortOrder,
      category,
      subcategory,
      priceRange,
      colors,
      sizes,
      inStock,
      isActive,
      isFeatured,
      tags,
      search
    } = req.query;

    const filters = {
      category: category as string,
      subcategory: subcategory as string,
      priceRange: priceRange ? JSON.parse(priceRange as string) : undefined,
      colors: colors ? (colors as string).split(',') : undefined,
      sizes: sizes ? (sizes as string).split(',') : undefined,
      inStock: inStock ? inStock === 'true' : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      isFeatured: isFeatured ? isFeatured === 'true' : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      search: search as string,
    };

    const params = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sortBy: sortBy as string || 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc' || 'desc',
    };

    const result = await productService.getProducts(filters as ProductFilters, params);
    
    // Transform response to match frontend expectations
    const transformedResponse = {
      products: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      }
    };
    
    sendSuccess(res, transformedResponse, 'Products retrieved');
  }),

  // Get product by ID
  getProductById: asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const product = await productService.getProductById(productId as string);
    sendSuccess(res, product, 'Product retrieved');
  }),

  // Get product by slug
  getProductBySlug: asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug as string);
    sendSuccess(res, product, 'Product retrieved');
  }),

  // Admin: Create product
  createProduct: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body);
    sendSuccess(res, product, 'Product created successfully', 201);
  }),

  // Admin: Create product with FormData (includes image upload)
  createProductWithImages: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.createProductWithImages(req.body, req.files as Express.Multer.File[]);
    sendSuccess(res, product, 'Product created successfully with images', 201);
  }),

  // Admin: Update product
  updateProduct: asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const product = await productService.updateProduct(productId as string, req.body);
    sendSuccess(res, product, 'Product updated successfully');
  }),

  // Admin: Delete product
  deleteProduct: asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    await productService.deleteProduct(productId as string);
    sendSuccess(res, null, 'Product deleted successfully');
  }),

  // Get all categories
  getCategories: asyncHandler(async (req: Request, res: Response) => {
    const categories = await productService.getCategories();
    sendSuccess(res, categories, 'Categories retrieved');
  }),

  // Get category by ID
  getCategoryById: asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const category = await productService.getCategoryById(categoryId as string);
    sendSuccess(res, category, 'Category retrieved');
  }),

  // Admin: Create category
  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const category = await productService.createCategory(req.body);
    sendSuccess(res, category, 'Category created successfully', 201);
  }),

  // Admin: Update category
  updateCategory: asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const category = await productService.updateCategory(categoryId as string, req.body);
    sendSuccess(res, category, 'Category updated successfully');
  }),

  // Admin: Delete category
  deleteCategory: asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    await productService.deleteCategory(categoryId as string);
    sendSuccess(res, null, 'Category deleted successfully');
  }),

  // Get product reviews
  getProductReviews: asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { page, limit } = req.query;
    
    const reviews = await productService.getProductReviews(productId as string, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
    
    sendSuccess(res, reviews, 'Product reviews retrieved');
  }),

  // Create product review
  createReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.params;
    const review = await productService.createReview(ensureUser(req), productId as string, req.body);
    sendSuccess(res, review, 'Review created successfully', 201);
  }),

  // Update product review
  updateReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { reviewId } = req.params;
    const review = await productService.updateReview(ensureUser(req), reviewId as string, req.body);
    sendSuccess(res, review, 'Review updated successfully');
  }),

  // Delete product review
  deleteReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { reviewId } = req.params;
    await productService.deleteReview(ensureUser(req), reviewId as string);
    sendSuccess(res, null, 'Review deleted successfully');
  }),

  // Admin: Bulk delete products
  bulkDeleteProducts: asyncHandler(async (req: Request, res: Response) => {
    const { productIds } = req.body;
    const result = await productService.bulkDeleteProducts(productIds as string[]);
    sendSuccess(res, result, 'Products deleted successfully');
  }),

  // Admin: Get all products (including inactive) for admin panel
  getAdminProducts: asyncHandler(async (req: Request, res: Response) => {
    const { 
      page, 
      limit, 
      sortBy, 
      sortOrder,
      category,
      subcategory,
      priceRange,
      colors,
      sizes,
      inStock,
      isActive,
      isFeatured,
      tags,
      search
    } = req.query;

    const filters = {
      category: category as string,
      subcategory: subcategory as string,
      priceRange: priceRange ? JSON.parse(priceRange as string) : undefined,
      colors: colors ? (colors as string).split(',') : undefined,
      sizes: sizes ? (sizes as string).split(',') : undefined,
      inStock: inStock ? inStock === 'true' : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      isFeatured: isFeatured ? isFeatured === 'true' : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      search: search as string,
    };

    const params = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sortBy: sortBy as string || 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc' || 'desc',
    };

    const result = await productService.getAdminProducts(filters as ProductFilters, params);
    
    // Transform response to match frontend expectations
    const transformedResponse = {
      products: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      }
    };
    
    sendSuccess(res, transformedResponse, 'Admin products retrieved');
  }),

  // Admin: Get product statistics
  getProductStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await productService.getProductStats();
    sendSuccess(res, stats, 'Product statistics retrieved');
  }),
};
