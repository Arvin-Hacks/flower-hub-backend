import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error';

// Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  logger.error('Cloudinary configuration missing:', {
    cloudName: !!cloudName,
    apiKey: !!apiKey,
    apiSecret: !!apiSecret
  });
  throw new Error('Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: any;
  quality?: string | number;
  format?: string;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
}

class CloudinaryService {
  /**
   * Upload a single image to Cloudinary
   */
  async uploadImage(
    file: Express.Multer.File | Buffer | string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadOptions = {
        folder: options.folder || 'flower-hub/products',
        quality: options.quality || 'auto',
        transformation: options.transformation || [
          {
            width: options.width || 800,
            height: options.height || 600,
            crop: options.crop || 'fill',
            gravity: options.gravity || 'auto',
            quality: 'auto',
          }
        ]
      };

      let result: any;
      
      if (Buffer.isBuffer(file)) {
        // Upload from buffer
        result = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${file.toString('base64')}`,
          uploadOptions
        );
      } else if (typeof file === 'string') {
        // Upload from URL
        result = await cloudinary.uploader.upload(file, uploadOptions);
      } else {
        // Upload from multer file
        result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
            if (error) {
              reject(error);
            } else {
              resolve(uploadResult);
            }
          });
          
          const readable = new Readable();
          readable.push(file.buffer);
          readable.push(null);
          readable.pipe(stream);
        });
      }

      // Validate result before using it
      if (!result || !result.public_id) {
        logger.error('Invalid Cloudinary upload result:', result);
        throw new AppError('Invalid upload result from Cloudinary', 500);
      }

      logger.info('Image uploaded to Cloudinary', {
        public_id: result.public_id,
        url: result.secure_url,
        size: result.bytes
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      logger.error('Error uploading image to Cloudinary:', error);
      throw new AppError('Failed to upload image', 500);
    }
  }

  /**
   * Upload multiple images to Cloudinary
   */
  async uploadMultipleImages(
    files: Express.Multer.File[] | Buffer[] | string[],
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, options));
      const results = await Promise.all(uploadPromises);
      
      logger.info(`Uploaded ${results.length} images to Cloudinary`);
      return results;
    } catch (error) {
      logger.error('Error uploading multiple images to Cloudinary:', error);
      throw new AppError('Failed to upload images', 500);
    }
  }

  /**
   * Delete a single image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        logger.info('Image deleted from Cloudinary', { public_id: publicId });
        return true;
      } else {
        logger.warn('Failed to delete image from Cloudinary', { 
          public_id: publicId, 
          result: result.result 
        });
        return false;
      }
    } catch (error) {
      logger.error('Error deleting image from Cloudinary:', error);
      throw new AppError('Failed to delete image', 500);
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  async deleteMultipleImages(publicIds: string[]): Promise<{ deleted: string[], failed: string[] }> {
    try {
      const deletePromises = publicIds.map(async (publicId) => {
        try {
          const success = await this.deleteImage(publicId);
          return { publicId, success };
        } catch (error) {
          logger.error(`Failed to delete image ${publicId}:`, error);
          return { publicId, success: false };
        }
      });

      const results = await Promise.all(deletePromises);
      
      const deleted = results.filter(r => r.success).map(r => r.publicId);
      const failed = results.filter(r => !r.success).map(r => r.publicId);

      logger.info(`Deleted ${deleted.length} images from Cloudinary`, {
        deleted,
        failed
      });

      return { deleted, failed };
    } catch (error) {
      logger.error('Error deleting multiple images from Cloudinary:', error);
      throw new AppError('Failed to delete images', 500);
    }
  }

  /**
   * Get image information from Cloudinary
   */
  async getImageInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      logger.error('Error getting image info from Cloudinary:', error);
      throw new AppError('Failed to get image information', 500);
    }
  }

  /**
   * Generate optimized image URL with transformations
   */
  generateImageUrl(
    publicId: string,
    transformations: any = {}
  ): string {
    const defaultTransformations = {
      quality: 'auto',
      ...transformations
    };

    return cloudinary.url(publicId, defaultTransformations);
  }

  /**
   * Generate responsive image URLs for different screen sizes
   */
  generateResponsiveImageUrls(publicId: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      thumbnail: this.generateImageUrl(publicId, { width: 150, height: 150, crop: 'fill' }),
      small: this.generateImageUrl(publicId, { width: 300, height: 300, crop: 'fill' }),
      medium: this.generateImageUrl(publicId, { width: 600, height: 600, crop: 'fill' }),
      large: this.generateImageUrl(publicId, { width: 1200, height: 1200, crop: 'fill' }),
      original: this.generateImageUrl(publicId, { quality: 'auto' })
    };
  }

  /**
   * Upload image from base64 string
   */
  async uploadFromBase64(
    base64String: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const result = await cloudinary.uploader.upload(base64String, {
        folder: options.folder || 'flower-hub/products',
        quality: options.quality || 'auto',
        transformation: options.transformation || [
          {
            width: options.width || 800,
            height: options.height || 600,
            crop: options.crop || 'fill',
            gravity: options.gravity || 'auto',
            quality: 'auto',
          }
        ]
      });

      logger.info('Base64 image uploaded to Cloudinary', {
        public_id: result.public_id,
        url: result.secure_url
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      logger.error('Error uploading base64 image to Cloudinary:', error);
      throw new AppError('Failed to upload image', 500);
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/i);
      return matches ? matches[1] || null : null;
    } catch (error) {
      logger.error('Error extracting public ID from URL:', error);
      return null;
    }
  }

  /**
   * Check if URL is a Cloudinary URL
   */
  isCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
