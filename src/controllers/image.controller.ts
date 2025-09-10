import { Request, Response } from 'express';
import { cloudinaryService } from '../services/cloudinary.service';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

export const imageController = {
  // Upload single image
  uploadSingle: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return sendError(res, 'No image file provided', 400);
    }

    try {
      const result = await cloudinaryService.uploadImage(req.file, {
        folder: 'flower-hub/products'
      });

      sendSuccess(res, {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }, 'Image uploaded successfully');
    } catch (error) {
      logger.error('Error uploading single image:', error);
      sendError(res, 'Failed to upload image', 500);
    }
  }),

  // Upload multiple images
  uploadMultiple: asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return sendError(res, 'No image files provided', 400);
    }

    try {
      const results = await cloudinaryService.uploadMultipleImages(req.files, {
        folder: 'flower-hub/products'
      });

      const response = results.map(result => ({
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }));

      sendSuccess(res, response, `${results.length} images uploaded successfully`);
    } catch (error) {
      logger.error('Error uploading multiple images:', error);
      sendError(res, 'Failed to upload images', 500);
    }
  }),

  // Upload from base64
  uploadFromBase64: asyncHandler(async (req: Request, res: Response) => {
    const { base64, folder } = req.body;

    if (!base64) {
      return sendError(res, 'Base64 string is required', 400);
    }

    try {
      const result = await cloudinaryService.uploadFromBase64(base64, {
        folder: folder || 'flower-hub/products'
      });

      sendSuccess(res, {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }, 'Image uploaded successfully from base64');
    } catch (error) {
      logger.error('Error uploading base64 image:', error);
      sendError(res, 'Failed to upload image', 500);
    }
  }),

  // Delete single image
  deleteImage: asyncHandler(async (req: Request, res: Response) => {
    const { publicId } = req.params;

    if (!publicId) {
      return sendError(res, 'Public ID is required', 400);
    }

    try {
      const success = await cloudinaryService.deleteImage(publicId);
      
      if (success) {
        sendSuccess(res, { public_id: publicId }, 'Image deleted successfully');
      } else {
        sendError(res, 'Failed to delete image', 500);
      }
    } catch (error) {
      logger.error('Error deleting image:', error);
      sendError(res, 'Failed to delete image', 500);
    }
  }),

  // Delete multiple images
  deleteMultiple: asyncHandler(async (req: Request, res: Response) => {
    const { publicIds } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return sendError(res, 'Public IDs array is required', 400);
    }

    try {
      const result = await cloudinaryService.deleteMultipleImages(publicIds);
      
      sendSuccess(res, result, `Deleted ${result.deleted.length} images successfully`);
    } catch (error) {
      logger.error('Error deleting multiple images:', error);
      sendError(res, 'Failed to delete images', 500);
    }
  }),

  // Get image information
  getImageInfo: asyncHandler(async (req: Request, res: Response) => {
    const { publicId } = req.params;

    if (!publicId) {
      return sendError(res, 'Public ID is required', 400);
    }

    try {
      const info = await cloudinaryService.getImageInfo(publicId);
      sendSuccess(res, info, 'Image information retrieved successfully');
    } catch (error) {
      logger.error('Error getting image info:', error);
      sendError(res, 'Failed to get image information', 500);
    }
  }),

  // Generate responsive URLs
  generateResponsiveUrls: asyncHandler(async (req: Request, res: Response) => {
    const { publicId } = req.params;

    if (!publicId) {
      return sendError(res, 'Public ID is required', 400);
    }

    try {
      const urls = cloudinaryService.generateResponsiveImageUrls(publicId);
      sendSuccess(res, urls, 'Responsive URLs generated successfully');
    } catch (error) {
      logger.error('Error generating responsive URLs:', error);
      sendError(res, 'Failed to generate responsive URLs', 500);
    }
  }),

  // Extract public ID from URL
  extractPublicId: asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
      return sendError(res, 'URL is required', 400);
    }

    try {
      const publicId = cloudinaryService.extractPublicId(url);
      
      if (publicId) {
        sendSuccess(res, { public_id: publicId }, 'Public ID extracted successfully');
      } else {
        sendError(res, 'Invalid Cloudinary URL', 400);
      }
    } catch (error) {
      logger.error('Error extracting public ID:', error);
      sendError(res, 'Failed to extract public ID', 500);
    }
  })
};
