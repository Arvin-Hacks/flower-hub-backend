import { Router } from 'express';
import { imageController } from '../controllers/image.controller';
import { uploadSingle, uploadMultiple, handleUploadError } from '../middleware/upload';
import { authenticate, adminOnly } from '../middleware/auth';
import { validate } from '../utils/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const base64UploadSchema = Joi.object({
  base64: Joi.string().required(),
  folder: Joi.string().optional()
});

const deleteMultipleSchema = Joi.object({
  publicIds: Joi.array().items(Joi.string()).min(1).required()
});

const extractPublicIdSchema = Joi.object({
  url: Joi.string().uri().required()
});

// Public routes (for now, can be restricted later)
router.post('/upload/single', uploadSingle('image'), handleUploadError, imageController.uploadSingle);
router.post('/upload/multiple', uploadMultiple('images', 10), handleUploadError, imageController.uploadMultiple);
router.post('/upload/base64', validate(base64UploadSchema), imageController.uploadFromBase64);

// Protected routes (require authentication)
router.delete('/delete/:publicId', authenticate, imageController.deleteImage);
router.post('/delete/multiple', authenticate, validate(deleteMultipleSchema), imageController.deleteMultiple);
router.get('/info/:publicId', authenticate, imageController.getImageInfo);
router.get('/responsive/:publicId', authenticate, imageController.generateResponsiveUrls);
router.post('/extract-public-id', authenticate, validate(extractPublicIdSchema), imageController.extractPublicId);

export default router;
