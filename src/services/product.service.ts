import { prisma } from '../database';
import { 
  Product, 
  ProductCategory, 
  ProductReview,
  CreateProductRequest, 
  UpdateProductRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateReviewRequest,
  UpdateReviewRequest,
  ProductFilters,
  PaginationParams,
  PaginatedResponse
} from '../types';
import { AppError } from '../middleware/error';
import { calculatePagination, generateSlug } from '../utils/helpers';
import { logger } from '../utils/logger';
import { cloudinaryService } from './cloudinary.service';

export const productService = {
  // Get all products
  async getProducts(filters: ProductFilters, params: PaginationParams): Promise<PaginatedResponse<Product>> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = params;

    const { offset } = calculatePagination(page, limit, 0);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (filters.category) {
      where.category = { slug: filters.category };
    }

    if (filters.subcategory) {
      where.subcategory = filters.subcategory;
    }

    if (filters.priceRange) {
      where.price = {
        gte: filters.priceRange[0],
        lte: filters.priceRange[1],
      };
    }

    if (filters.colors && filters.colors.length > 0) {
      where.colors = { hasSome: filters.colors };
    }

    if (filters.sizes && filters.sizes.length > 0) {
      where.sizes = { hasSome: filters.sizes };
    }

    if (filters.inStock !== undefined) {
      where.inStock = filters.inStock;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } },
      ];
    }

    // Build order by clause
    let orderBy: Record<string, string> = { [sortBy]: sortOrder };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'name_asc') orderBy = { name: 'asc' };
    if (sortBy === 'name_desc') orderBy = { name: 'desc' };
    if (sortBy === 'rating') orderBy = { rating: 'desc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
    if (sortBy === 'popular') orderBy = { reviewCount: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: products as Product[],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },

  // Get product by ID
  async getProductById(productId: string): Promise<Product> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product as Product;
  },

  // Get product by slug
  async getProductBySlug(slug: string): Promise<Product> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product as Product;
  },

  // Create product (admin only)
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const slug = generateSlug(data.name);

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      throw new AppError('Product with this name already exists', 409);
    }

    // Handle static category IDs by creating categories if they don't exist
    let categoryId = data.categoryId;
    if (categoryId.startsWith('00000000000000000000000')) {
      // This is a static category ID, create the category if it doesn't exist
      const staticCategoryMap = {
        '000000000000000000000001': { name: 'Roses', description: 'Beautiful roses in various colors and arrangements', image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500' },
        '000000000000000000000002': { name: 'Tulips', description: 'Elegant tulips perfect for any occasion', image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=500' },
        '000000000000000000000003': { name: 'Lilies', description: 'Fragrant lilies that bring elegance to any space', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500' },
        '000000000000000000000004': { name: 'Sunflowers', description: 'Bright and cheerful sunflowers to brighten your day', image: 'https://images.unsplash.com/photo-1597848212624-e17eb5d2e0b4?w=500' },
        '000000000000000000000005': { name: 'Orchids', description: 'Exotic orchids for the sophisticated flower lover', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500' },
        '000000000000000000000006': { name: 'Bouquets', description: 'Beautiful flower bouquets for any occasion', image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500' },
        '000000000000000000000007': { name: 'Arrangements', description: 'Elegant flower arrangements for home and office', image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=500' },
        '000000000000000000000008': { name: 'Plants', description: 'Live plants and potted flowers', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500' },
        '000000000000000000000009': { name: 'Centerpieces', description: 'Beautiful centerpieces for special occasions', image: 'https://images.unsplash.com/photo-1597848212624-e17eb5d2e0b4?w=500' },
        '000000000000000000000010': { name: 'Decorations', description: 'Decorative flowers and arrangements', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500' }
      };

      const categoryData = staticCategoryMap[categoryId as keyof typeof staticCategoryMap];
      if (categoryData) {
        // Check if category already exists by name
        let existingCategory = await prisma.productCategory.findUnique({
          where: { name: categoryData.name }
        });

        if (!existingCategory) {
          // Create the category
          existingCategory = await prisma.productCategory.create({
            data: {
              name: categoryData.name,
              slug: generateSlug(categoryData.name),
              description: categoryData.description,
              image: categoryData.image,
              sortOrder: parseInt(categoryId.slice(-1)) || 0
            }
          });
          logger.info('Static category created', { categoryId: existingCategory.id, name: existingCategory.name });
        }
        categoryId = existingCategory.id;
      }
    }

    // Upload images to Cloudinary if they are blob URLs
    let uploadedImages = data.images;
    if (data.images && data.images.length > 0) {
      const blobImages = data.images.filter(img => img.startsWith('blob:'));
      if (blobImages.length > 0) {
        // For now, we'll keep the blob URLs as they are
        // In a real implementation, you would upload these to Cloudinary
        logger.warn('Blob URLs detected in product images. Consider implementing proper image upload.');
      }
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        images: uploadedImages,
        categoryId,
        slug,
        inStock: data.stockCount > 0,
      },
      include: {
        category: true,
      },
    });

    logger.info('Product created', { productId: product.id, name: product.name });

    return product as Product;
  },

  // Create product with FormData and handle image uploads
  async createProductWithImages(formData: any, files: Express.Multer.File[]): Promise<Product> {
    const slug = generateSlug(formData.name);

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      throw new AppError('Product with this name already exists', 409);
    }

    // Handle static category IDs by creating categories if they don't exist
    let categoryId = formData.categoryId;
    if (categoryId && categoryId.startsWith('00000000000000000000000')) {
      const staticCategoryMap = {
        '000000000000000000000001': { name: 'Roses', description: 'Beautiful roses in various colors and arrangements', image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500' },
        '000000000000000000000002': { name: 'Tulips', description: 'Elegant tulips perfect for any occasion', image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=500' },
        '000000000000000000000003': { name: 'Lilies', description: 'Fragrant lilies that bring elegance to any space', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500' },
        '000000000000000000000004': { name: 'Sunflowers', description: 'Bright and cheerful sunflowers to brighten your day', image: 'https://images.unsplash.com/photo-1597848212624-e17eb5d2e0b4?w=500' },
        '000000000000000000000005': { name: 'Orchids', description: 'Exotic orchids for the sophisticated flower lover', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500' },
        '000000000000000000000006': { name: 'Bouquets', description: 'Beautiful flower bouquets for any occasion', image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500' },
        '000000000000000000000007': { name: 'Arrangements', description: 'Elegant flower arrangements for home and office', image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=500' },
        '000000000000000000000008': { name: 'Plants', description: 'Live plants and potted flowers', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500' },
        '000000000000000000000009': { name: 'Centerpieces', description: 'Beautiful centerpieces for special occasions', image: 'https://images.unsplash.com/photo-1597848212624-e17eb5d2e0b4?w=500' },
        '000000000000000000000010': { name: 'Decorations', description: 'Decorative flowers and arrangements', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500' }
      };

      const categoryData = staticCategoryMap[categoryId as keyof typeof staticCategoryMap];
      if (categoryData) {
        let existingCategory = await prisma.productCategory.findUnique({
          where: { name: categoryData.name }
        });

        if (!existingCategory) {
          existingCategory = await prisma.productCategory.create({
            data: {
              name: categoryData.name,
              slug: generateSlug(categoryData.name),
              description: categoryData.description,
              image: categoryData.image,
              sortOrder: parseInt(categoryId.slice(-1)) || 0
            }
          });
          logger.info('Static category created', { categoryId: existingCategory.id, name: existingCategory.name });
        }
        categoryId = existingCategory.id;
      }
    }

    // Parse form data arrays
    const colors = formData.colors ? JSON.parse(formData.colors) : [];
    const sizes = formData.sizes ? JSON.parse(formData.sizes) : [];
    const tags = formData.tags ? JSON.parse(formData.tags) : [];
    const features = formData.features ? JSON.parse(formData.features) : [];
    const care = formData.care ? JSON.parse(formData.care) : [];

    // Create product first (without images)
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      categoryId,
      subcategory: formData.subcategory,
      images: [], // Will be updated after image upload
      colors,
      sizes,
      stockCount: parseInt(formData.stockCount),
      tags,
      features,
      care,
      isActive: formData.isActive === 'true',
      isFeatured: formData.isFeatured === 'true',
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      length: formData.length ? parseFloat(formData.length) : undefined,
      width: formData.width ? parseFloat(formData.width) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      dimensionUnit: formData.dimensionUnit,
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
    };

    const product = await prisma.product.create({
      data: {
        ...productData,
        categoryId: productData.categoryId,
        slug,
        inStock: productData.stockCount > 0,
      } as any,
      include: {
        category: true,
      },
    });

    logger.info('Product created', { productId: product.id, name: product.name });

    // Upload images to Cloudinary if files are provided
    let uploadedImages: string[] = [];
    if (files && files.length > 0) {
      try {
        const uploadResults = await cloudinaryService.uploadMultipleImages(files, {
          folder: 'flower-hub/products'
        });
        uploadedImages = uploadResults.map(result => result.secure_url);
        
        // Update product with uploaded image URLs
        await prisma.product.update({
          where: { id: product.id },
          data: { images: uploadedImages }
        });

        logger.info('Product images uploaded', { 
          productId: product.id, 
          imageCount: uploadedImages.length 
        });
      } catch (error) {
        logger.error('Error uploading product images:', error);
        // Don't fail the entire operation if image upload fails
        // The product is already created, just without images
        logger.warn('Product created but image upload failed', { productId: product.id });
      }
    }

    // Return the updated product with images
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
      },
    });

    return updatedProduct as Product;
  },

  // Upload product images to Cloudinary
  async uploadProductImages(files: Express.Multer.File[]): Promise<string[]> {
    try {
      const results = await cloudinaryService.uploadMultipleImages(files, {
        folder: 'flower-hub/products'
      });
      
      return results.map(result => result.secure_url);
    } catch (error) {
      logger.error('Error uploading product images:', error);
      throw new AppError('Failed to upload product images', 500);
    }
  },

  // Delete product images from Cloudinary
  async deleteProductImages(imageUrls: string[]): Promise<{ deleted: string[], failed: string[] }> {
    try {
      const publicIds = imageUrls
        .map(url => cloudinaryService.extractPublicId(url))
        .filter(id => id !== null) as string[];

      if (publicIds.length === 0) {
        return { deleted: [], failed: [] };
      }

      return await cloudinaryService.deleteMultipleImages(publicIds);
    } catch (error) {
      logger.error('Error deleting product images:', error);
      throw new AppError('Failed to delete product images', 500);
    }
  },

  // Update product (admin only)
  async updateProduct(productId: string, data: UpdateProductRequest): Promise<Product> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const updateData: Record<string, unknown> = { ...data };

    // If name is being updated, generate new slug
    if (data.name && data.name !== product.name) {
      const newSlug = generateSlug(data.name);
      
      // Check if new slug already exists
      const existingProduct = await prisma.product.findUnique({
        where: { slug: newSlug },
      });

      if (existingProduct && existingProduct.id !== productId) {
        throw new AppError('Product with this name already exists', 409);
      }

      updateData.slug = newSlug;
    }

    // Update stock status
    if (data.stockCount !== undefined) {
      updateData.inStock = data.stockCount > 0;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
      },
    });

    logger.info('Product updated', { productId, name: updatedProduct.name });

    return updatedProduct as Product;
  },

  // Delete product (admin only)
  async deleteProduct(productId: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    logger.info('Product deleted', { productId, name: product.name });
  },

  // Get all categories
  async getCategories(): Promise<ProductCategory[]> {
    return prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    }) as Promise<ProductCategory[]>;
  },

  // Get category by ID
  async getCategoryById(categoryId: string): Promise<ProductCategory> {
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category as ProductCategory;
  },

  // Create category (admin only)
  async createCategory(data: CreateCategoryRequest): Promise<ProductCategory> {
    const slug = generateSlug(data.name);

    // Check if slug already exists
    const existingCategory = await prisma.productCategory.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new AppError('Category with this name already exists', 409);
    }

    const category = await prisma.productCategory.create({
      data: {
        ...data,
        slug,
      },
    });

    logger.info('Category created', { categoryId: category.id, name: category.name });

    return category as ProductCategory;
  },

  // Update category (admin only)
  async updateCategory(categoryId: string, data: UpdateCategoryRequest): Promise<ProductCategory> {
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const updateData: Record<string, unknown> = { ...data };

    // If name is being updated, generate new slug
    if (data.name && data.name !== category.name) {
      const newSlug = generateSlug(data.name);
      
      // Check if new slug already exists
      const existingCategory = await prisma.productCategory.findUnique({
        where: { slug: newSlug },
      });

      if (existingCategory && existingCategory.id !== categoryId) {
        throw new AppError('Category with this name already exists', 409);
      }

      updateData.slug = newSlug;
    }

    const updatedCategory = await prisma.productCategory.update({
      where: { id: categoryId },
      data: updateData,
    });

    logger.info('Category updated', { categoryId, name: updatedCategory.name });

    return updatedCategory as ProductCategory;
  },

  // Delete category (admin only)
  async deleteCategory(categoryId: string): Promise<void> {
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      throw new AppError('Cannot delete category with products', 400);
    }

    // Check if category has children
    const childrenCount = await prisma.productCategory.count({
      where: { parentId: categoryId },
    });

    if (childrenCount > 0) {
      throw new AppError('Cannot delete category with subcategories', 400);
    }

    await prisma.productCategory.delete({
      where: { id: categoryId },
    });

    logger.info('Category deleted', { categoryId, name: category.name });
  },

  // Get product reviews
  async getProductReviews(productId: string, params: PaginationParams): Promise<PaginatedResponse<ProductReview>> {
    const { page = 1, limit = 10 } = params;
    const { offset } = calculatePagination(page, limit, 0);

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.productReview.count({ where: { productId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: reviews as ProductReview[],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },

  // Create product review
  async createReview(userId: string, productId: string, data: CreateReviewRequest): Promise<ProductReview> {
    // Check if user already reviewed this product
    const existingReview = await prisma.productReview.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new AppError('You have already reviewed this product', 409);
    }

    const review = await prisma.productReview.create({
      data: {
        ...data,
        userId,
        productId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(productId);

    logger.info('Product review created', { reviewId: review.id, productId, userId });

    return review as ProductReview;
  },

  // Update product review
  async updateReview(userId: string, reviewId: string, data: UpdateReviewRequest): Promise<ProductReview> {
    const review = await prisma.productReview.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    const updatedReview = await prisma.productReview.update({
      where: { id: reviewId },
      data,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(review.productId);

    logger.info('Product review updated', { reviewId, productId: review.productId, userId });

    return updatedReview as ProductReview;
  },

  // Delete product review
  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const review = await prisma.productReview.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    await prisma.productReview.delete({
      where: { id: reviewId },
    });

    // Update product rating
    await this.updateProductRating(review.productId);

    logger.info('Product review deleted', { reviewId, productId: review.productId, userId });
  },

  // Update product rating (private helper)
  async updateProductRating(productId: string): Promise<void> {
    const reviews = await prisma.productReview.findMany({
      where: { productId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      await prisma.product.update({
        where: { id: productId },
        data: { rating: 0, reviewCount: 0 },
      });
      return;
    }

    const averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        reviewCount: reviews.length,
      },
    });
  },

  // Admin: Get all products (including inactive) for admin panel
  async getAdminProducts(filters: ProductFilters, params: PaginationParams): Promise<PaginatedResponse<Product>> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = params;

    const { offset } = calculatePagination(page, limit, 0);

    // Build where clause (no isActive filter for admin)
    const where: Record<string, unknown> = {};

    if (filters.category) {
      where.category = { slug: filters.category };
    }

    if (filters.subcategory) {
      where.subcategory = filters.subcategory;
    }

    if (filters.priceRange) {
      where.price = {
        gte: filters.priceRange[0],
        lte: filters.priceRange[1],
      };
    }

    if (filters.colors && filters.colors.length > 0) {
      where.colors = { hasSome: filters.colors };
    }

    if (filters.sizes && filters.sizes.length > 0) {
      where.sizes = { hasSome: filters.sizes };
    }

    if (filters.inStock !== undefined) {
      where.inStock = filters.inStock;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } },
      ];
    }

    // Build order by clause
    let orderBy: Record<string, string> = { [sortBy]: sortOrder };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'name_asc') orderBy = { name: 'asc' };
    if (sortBy === 'name_desc') orderBy = { name: 'desc' };
    if (sortBy === 'rating') orderBy = { rating: 'desc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
    if (sortBy === 'popular') orderBy = { reviewCount: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: products as Product[],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },

  // Admin: Bulk delete products
  async bulkDeleteProducts(productIds: string[]): Promise<{ deleted: number; failed: string[] }> {
    const failed: string[] = [];
    let deleted = 0;

    for (const productId of productIds) {
      try {
        await prisma.product.delete({
          where: { id: productId },
        });
        deleted++;
        logger.info('Product deleted via bulk operation', { productId });
      } catch (error) {
        logger.error('Failed to delete product in bulk operation', { productId, error });
        failed.push(productId);
      }
    }

    return { deleted, failed };
  },

  // Admin: Get product statistics
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
    featured: number;
    categories: number;
  }> {
    const [
      total,
      active,
      inactive,
      inStock,
      outOfStock,
      lowStock,
      featured,
      categories
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.product.count({ where: { inStock: true } }),
      prisma.product.count({ where: { inStock: false } }),
      prisma.product.count({ where: { inStock: true, stockCount: { lt: 10 } } }),
      prisma.product.count({ where: { isFeatured: true } }),
      prisma.productCategory.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      active,
      inactive,
      inStock,
      outOfStock,
      lowStock,
      featured,
      categories,
    };
  },
};
