# Flower Hub Backend API

A professional, scalable backend API for the Flower Hub e-commerce platform built with TypeScript, Express.js, and Prisma.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (User, Admin, Super Admin)
- **User Management**: Complete user profiles, addresses, and preferences
- **Product Management**: Products, categories, reviews, and inventory tracking
- **Order Management**: Order processing, status tracking, and payment integration
- **Cart & Wishlist**: Shopping cart and wishlist functionality
- **Admin Panel**: Comprehensive admin dashboard for managing the platform
- **Security**: Rate limiting, input validation, CORS, and security headers
- **Database**: PostgreSQL with Prisma ORM
- **TypeScript**: Full type safety and modern JavaScript features

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Custom logger with file output

## Project Structure

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   ├── services/            # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript type definitions
│   ├── database/            # Database configuration
│   └── server.ts            # Application entry point
├── prisma/
│   └── schema.prisma        # Database schema
├── logs/                    # Application logs
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flower-2/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/flower_hub_db"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_EXPIRES_IN="7d"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
   JWT_REFRESH_EXPIRES_IN="30d"
   
   # Server
   PORT=5000
   NODE_ENV="development"
   
   # CORS
   FRONTEND_URL="http://localhost:5173"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed the database
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh-token` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | No |
| POST | `/auth/logout-all` | Logout from all devices | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |
| POST | `/auth/change-password` | Change password | Yes |
| GET | `/auth/me` | Get current user | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update user profile | Yes |
| DELETE | `/users/account` | Delete user account | Yes |
| GET | `/users/addresses` | Get user addresses | Yes |
| POST | `/users/addresses` | Create address | Yes |
| PUT | `/users/addresses/:id` | Update address | Yes |
| DELETE | `/users/addresses/:id` | Delete address | Yes |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products | No |
| GET | `/products/:id` | Get product by ID | No |
| GET | `/products/slug/:slug` | Get product by slug | No |
| GET | `/products/categories` | Get all categories | No |
| GET | `/products/:id/reviews` | Get product reviews | No |
| POST | `/products/:id/reviews` | Create product review | Yes |
| PUT | `/products/reviews/:id` | Update review | Yes |
| DELETE | `/products/reviews/:id` | Delete review | Yes |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/orders/my-orders` | Get user orders | Yes |
| GET | `/orders/:id` | Get order by ID | Yes |
| POST | `/orders` | Create order | Yes |
| PUT | `/orders/:id/cancel` | Cancel order | Yes |
| GET | `/orders/coupons` | Get available coupons | No |

### Cart Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get user cart | Yes |
| POST | `/cart/add` | Add item to cart | Yes |
| PUT | `/cart/items/:id` | Update cart item | Yes |
| DELETE | `/cart/items/:id` | Remove cart item | Yes |
| DELETE | `/cart/clear` | Clear cart | Yes |
| GET | `/cart/wishlist` | Get wishlist | Yes |
| POST | `/cart/wishlist/add` | Add to wishlist | Yes |
| DELETE | `/cart/wishlist/:id` | Remove from wishlist | Yes |

### Admin Endpoints

All admin endpoints require admin or super admin role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/admin/users` | Get all users |
| POST | `/users/admin/users` | Create user |
| PUT | `/users/admin/users/:id` | Update user |
| DELETE | `/users/admin/users/:id` | Delete user |
| GET | `/users/admin/stats` | Get user statistics |
| POST | `/products/admin/products` | Create product |
| PUT | `/products/admin/products/:id` | Update product |
| DELETE | `/products/admin/products/:id` | Delete product |
| POST | `/products/admin/categories` | Create category |
| PUT | `/products/admin/categories/:id` | Update category |
| DELETE | `/products/admin/categories/:id` | Delete category |
| GET | `/orders/admin/orders` | Get all orders |
| PUT | `/orders/admin/orders/:id` | Update order |
| GET | `/orders/admin/summary` | Get order summary |
| POST | `/orders/admin/coupons` | Create coupon |
| PUT | `/orders/admin/coupons/:id` | Update coupon |
| DELETE | `/orders/admin/coupons/:id` | Delete coupon |

## Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm test             # Run tests
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `30d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Optional |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Optional |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Optional |
| `SMTP_HOST` | SMTP server host | Optional |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | Optional |
| `SMTP_PASS` | SMTP password | Optional |
| `STRIPE_SECRET_KEY` | Stripe secret key | Optional |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Optional |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Optional |

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Joi-based request validation
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection Protection**: Prisma ORM protection

## Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

## Logging

- Development: Console logging with Morgan
- Production: File logging to `logs/` directory
- Error tracking with stack traces
- Request/response logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## License

MIT License - see LICENSE file for details
