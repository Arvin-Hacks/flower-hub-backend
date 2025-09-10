# 🌸 Flower Hub Backend API

A professional, scalable backend API for the Flower Hub e-commerce platform built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="mongodb://localhost:27017/flower-hub"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Server
PORT=5000
NODE_ENV=development

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Database Setup
Run the complete database setup (generates client, runs migrations, and seeds data):
```bash
npm run db:setup
```

Or run individual steps:
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build the project for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:setup` | Complete database setup |

## 🗄️ Database Schema

### Core Models
- **User** - User accounts and authentication
- **Product** - Flower products with variants
- **ProductCategory** - Product categorization
- **CartItem** - Shopping cart items
- **WishlistItem** - User wishlist items
- **Order** - Customer orders
- **OrderItem** - Individual order items
- **Address** - User shipping/billing addresses
- **Coupon** - Discount codes
- **ProductReview** - Product reviews and ratings

### Key Features
- **MongoDB** with Prisma ORM
- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (USER, ADMIN, SUPER_ADMIN)
- **Image Upload** with Cloudinary integration
- **Comprehensive Product Management**
- **Shopping Cart & Wishlist**
- **Order Management System**
- **Coupon System**
- **Review System**

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products (with filtering, pagination)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/featured` - Get featured products
- `GET /api/products/popular` - Get popular products
- `GET /api/products/new` - Get new products
- `GET /api/products/sale` - Get products on sale
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/bulk-delete` - Bulk delete products (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item
- `DELETE /api/cart/clear` - Clear entire cart

### Wishlist
- `GET /api/cart/wishlist` - Get user's wishlist
- `POST /api/cart/wishlist/add` - Add item to wishlist
- `DELETE /api/cart/wishlist/:id` - Remove wishlist item
- `POST /api/cart/wishlist/:id/move-to-cart` - Move to cart

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/cancel` - Cancel order

### Admin
- `GET /api/admin/products` - Get all products (Admin)
- `GET /api/admin/products/stats` - Get product statistics
- `GET /api/admin/orders` - Get all orders (Admin)
- `PUT /api/admin/orders/:id` - Update order status (Admin)

## 🌱 Sample Data

The database comes pre-seeded with:

### Users
- **Admin**: `admin@flowerhub.com` / `admin123`
- **User**: `user@flowerhub.com` / `user123`

### Categories (10)
- Roses, Tulips, Lilies, Sunflowers, Orchids
- Bouquets, Arrangements, Plants, Centerpieces, Decorations

### Products (20+)
- Comprehensive product catalog with realistic data
- Multiple variants (colors, sizes)
- Pricing, ratings, reviews
- High-quality images from Unsplash

### Coupons
- `WELCOME10` - 10% off orders over $25
- `SAVE20` - $20 off orders over $100

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="mongodb://localhost:27017/flower-hub"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=5000
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛡️ Security Features

- **JWT Authentication** with refresh tokens
- **Password Hashing** with bcrypt
- **Rate Limiting** to prevent abuse
- **CORS Protection** with configurable origins
- **Input Validation** with Joi schemas
- **SQL Injection Protection** with Prisma ORM
- **XSS Protection** with proper sanitization

## 📊 Monitoring & Logging

- **Structured Logging** with Winston
- **Request Logging** middleware
- **Error Tracking** with detailed stack traces
- **Performance Monitoring** with response times

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testNamePattern="Product"
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
```

## 📖 API Documentation

### Request/Response Format
All API responses follow this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... } // For paginated responses
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Authentication
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [Seeding Guide](./SEEDING_GUIDE.md)
- Review the API documentation
- Check the troubleshooting section
- Open an issue on GitHub

---

**Happy Coding! 🌸✨**