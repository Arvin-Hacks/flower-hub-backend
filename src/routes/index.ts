import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import cartRoutes from './cart.routes';
import imageRoutes from './image.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/images', imageRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Flower Hub API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
