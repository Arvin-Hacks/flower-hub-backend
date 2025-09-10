# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image uploads in the Flower Hub application.

## 1. Create a Cloudinary Account

1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your Cloudinary Credentials

1. Log in to your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy the following values:
   - Cloud Name
   - API Key
   - API Secret

## 3. Create Upload Preset (for Direct Uploads)

1. Go to Cloudinary Dashboard
2. Navigate to "Settings" > "Upload"
3. Click "Add upload preset"
4. Configure the preset:
   - **Preset name**: `flower-hub-upload`
   - **Signing Mode**: Unsigned (for direct uploads)
   - **Folder**: `flower-hub`
   - **Quality**: Auto
   - **Format**: Auto
   - **Transformations**: Add any default transformations

## 4. Environment Variables

### Backend `.env` file:
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### Frontend `.env` file:
```env
# Cloudinary Configuration (for direct uploads)
REACT_APP_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
REACT_APP_CLOUDINARY_UPLOAD_PRESET="flower-hub-upload"
```

## 5. Install Dependencies

The following packages are already included in the project:

### Backend
- `cloudinary` - Cloudinary SDK for Node.js
- `multer` - File upload middleware

### Frontend
- No additional packages needed (using fetch API)

## 6. Features Included

### Backend Services
- **Single Image Upload**: Upload one image at a time
- **Multiple Image Upload**: Upload multiple images in one request
- **Base64 Upload**: Upload images from base64 strings
- **Image Deletion**: Delete single or multiple images
- **Image Information**: Get detailed image metadata
- **Responsive URLs**: Generate URLs for different screen sizes
- **Public ID Extraction**: Extract public ID from Cloudinary URLs

### Frontend Services
- **File Upload**: Upload files to Cloudinary
- **Base64 Conversion**: Convert files to base64 for upload
- **Image Management**: Delete images from Cloudinary
- **URL Generation**: Generate optimized image URLs
- **Responsive Images**: Generate responsive image URLs

## 7. API Endpoints

### Image Upload
- `POST /api/images/upload/single` - Upload single image
- `POST /api/images/upload/multiple` - Upload multiple images
- `POST /api/images/upload/base64` - Upload from base64

### Image Management
- `DELETE /api/images/delete/:publicId` - Delete single image
- `POST /api/images/delete/multiple` - Delete multiple images
- `GET /api/images/info/:publicId` - Get image information
- `GET /api/images/responsive/:publicId` - Get responsive URLs
- `POST /api/images/extract-public-id` - Extract public ID from URL

## 8. Usage Examples

### Backend
```typescript
import { cloudinaryService } from '../services/cloudinary.service';

// Upload single image
const result = await cloudinaryService.uploadImage(file, {
  folder: 'flower-hub/products'
});

// Upload multiple images
const results = await cloudinaryService.uploadMultipleImages(files, {
  folder: 'flower-hub/products'
});

// Delete image
await cloudinaryService.deleteImage(publicId);
```

### Frontend
```typescript
import { imageAPI } from '../services/imageAPI';

// Upload single image
const result = await imageAPI.uploadSingle(file);

// Upload multiple images
const results = await imageAPI.uploadMultiple(files);

// Delete image
await imageAPI.deleteImage(publicId);
```

## 9. Image Transformations

The service automatically applies the following transformations:
- **Quality**: Auto-optimized
- **Format**: Auto-format (WebP when supported)
- **Size**: Configurable (default 800x600)
- **Crop**: Fill with auto gravity

## 10. Folder Structure

Images are organized in the following folder structure:
- `flower-hub/products/` - Product images
- `flower-hub/categories/` - Category images
- `flower-hub/users/` - User profile images

## 11. Error Handling

The service includes comprehensive error handling:
- File size validation (10MB limit)
- File type validation (images only)
- Upload failure handling
- Delete failure handling
- Network error handling

## 12. Security

- All uploads require authentication (except public uploads)
- File type validation
- File size limits
- Secure URL generation
- Public ID validation

## 13. Performance

- Automatic image optimization
- Responsive image generation
- Lazy loading support
- CDN delivery
- Caching headers

## 14. Monitoring

The service includes logging for:
- Upload success/failure
- Delete operations
- Error tracking
- Performance metrics

## 15. Testing

To test the image upload functionality:

1. Start the backend server
2. Use the provided API endpoints
3. Check the Cloudinary dashboard for uploaded images
4. Verify image URLs are accessible

## 16. Troubleshooting

### Common Issues

1. **Invalid credentials**: Check your environment variables
2. **Upload failures**: Verify file size and type
3. **Delete failures**: Ensure public ID is correct
4. **CORS issues**: Check CORS configuration

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed logs for troubleshooting.
