import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { validate } from '../utils/validation';
import { commonSchemas } from '../utils/validation';
import Joi from 'joi';
import { authenticate, adminOnly } from '../middleware/auth';
import { validateParams } from '../utils/validation';
import upload from '../middleware/upload';

const router = Router();

// Validation schemas
const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  price: Joi.number().positive().required(),
  originalPrice: Joi.number().positive().optional(),
  categoryId: commonSchemas.id,
  subcategory: Joi.string().min(2).max(50).required(),
  images: Joi.array().items(Joi.string().pattern(/^(https?:\/\/|blob:)/)).min(1).required(),
  colors: Joi.array().items(Joi.string()).min(1).required(),
  sizes: Joi.array().items(Joi.string()).min(1).required(),
  stockCount: Joi.number().integer().min(0).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  features: Joi.array().items(Joi.string()).optional(),
  care: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  weight: Joi.number().positive().optional(),
  length: Joi.number().positive().optional(),
  width: Joi.number().positive().optional(),
  height: Joi.number().positive().optional(),
  dimensionUnit: Joi.string().valid('cm', 'in').optional(),
  seoTitle: Joi.string().max(60).optional(),
  seoDescription: Joi.string().max(160).optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().min(10).max(1000).optional(),
  price: Joi.number().positive().optional(),
  originalPrice: Joi.number().positive().optional(),
  categoryId: commonSchemas.id.optional(),
  subcategory: Joi.string().min(2).max(50).optional(),
  images: Joi.array().items(Joi.string().pattern(/^(https?:\/\/|blob:)/)).min(1).optional(),
  colors: Joi.array().items(Joi.string()).min(1).optional(),
  sizes: Joi.array().items(Joi.string()).min(1).optional(),
  stockCount: Joi.number().integer().min(0).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  features: Joi.array().items(Joi.string()).optional(),
  care: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  weight: Joi.number().positive().optional(),
  length: Joi.number().positive().optional(),
  width: Joi.number().positive().optional(),
  height: Joi.number().positive().optional(),
  dimensionUnit: Joi.string().valid('cm', 'in').optional(),
  seoTitle: Joi.string().max(60).optional(),
  seoDescription: Joi.string().max(160).optional(),
});

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().min(10).max(200).required(),
  image: Joi.string().uri().required(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  parentId: commonSchemas.id.optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  description: Joi.string().min(10).max(200).optional(),
  image: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  parentId: commonSchemas.id.optional(),
});

const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().min(5).max(100).required(),
  comment: Joi.string().min(10).max(500).required(),
});

// FormData validation schema (for multipart/form-data)
const createProductFormDataSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  price: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).required(),
  originalPrice: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).optional(),
  categoryId: commonSchemas.id,
  subcategory: Joi.string().min(2).max(50).required(),
  colors: Joi.string().required(), // JSON string
  sizes: Joi.string().required(), // JSON string
  stockCount: Joi.string().pattern(/^\d+$/).required(),
  tags: Joi.string().optional(), // JSON string
  features: Joi.string().optional(), // JSON string
  care: Joi.string().optional(), // JSON string
  isActive: Joi.string().valid('true', 'false').optional(),
  isFeatured: Joi.string().valid('true', 'false').optional(),
  weight: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).optional(),
  length: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).optional(),
  width: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).optional(),
  height: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).optional(),
  dimensionUnit: Joi.string().valid('cm', 'in').optional(),
  seoTitle: Joi.string().max(60).optional(),
  seoDescription: Joi.string().max(160).optional(),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  title: Joi.string().min(5).max(100).optional(),
  comment: Joi.string().min(10).max(500).optional(),
});

const bulkDeleteSchema = Joi.object({
  productIds: Joi.array().items(commonSchemas.id).min(1).max(100).required(),
});

const idSchema = Joi.object({
  productId: commonSchemas.id,
});

const categoryIdSchema = Joi.object({
  categoryId: commonSchemas.id,
});

const reviewIdSchema = Joi.object({
  reviewId: commonSchemas.id,
});

const slugSchema = Joi.object({
  slug: Joi.string().required(),
});

// Public routes
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/categories/:categoryId', validateParams(categoryIdSchema), productController.getCategoryById);
router.get('/:productId', validateParams(idSchema), productController.getProductById);
router.get('/slug/:slug', validateParams(slugSchema), productController.getProductBySlug);
router.get('/:productId/reviews', validateParams(idSchema), productController.getProductReviews);

// Protected routes (authenticated users)
router.post('/:productId/reviews', authenticate, validateParams(idSchema), validate(createReviewSchema), productController.createReview);
router.put('/reviews/:reviewId', authenticate, validateParams(reviewIdSchema), validate(updateReviewSchema), productController.updateReview);
router.delete('/reviews/:reviewId', authenticate, validateParams(reviewIdSchema), productController.deleteReview);

// Admin routes
router.get('/admin/products', authenticate, productController.getAdminProducts);
router.get('/admin/products/stats', authenticate, productController.getProductStats);
router.post('/admin/products', authenticate, validate(createProductSchema), productController.createProduct);
router.post('/admin/products/formdata', authenticate, upload.array('images', 10), validate(createProductFormDataSchema), productController.createProductWithImages);
router.put('/admin/products/:productId', authenticate, validateParams(idSchema), validate(updateProductSchema), productController.updateProduct);
router.delete('/admin/products/:productId', authenticate, validateParams(idSchema), productController.deleteProduct);
router.post('/admin/products/bulk-delete', authenticate, validate(bulkDeleteSchema), productController.bulkDeleteProducts);

router.post('/admin/categories', authenticate, adminOnly, validate(createCategorySchema), productController.createCategory);
router.put('/admin/categories/:categoryId', authenticate, adminOnly, validateParams(categoryIdSchema), validate(updateCategorySchema), productController.updateCategory);
router.delete('/admin/categories/:categoryId', authenticate, adminOnly, validateParams(categoryIdSchema), productController.deleteCategory);

export default router;
