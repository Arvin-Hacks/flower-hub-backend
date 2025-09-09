import { Router } from 'express';
import { userController } from '@/controllers/user.controller';
import { validate } from '@/utils/validation';
import { commonSchemas } from '@/utils/validation';
import Joi from 'joi';
import { authenticate, adminOnly } from '@/middleware/auth';
import { validateParams } from '@/utils/validation';

const router = Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: commonSchemas.name.optional(),
  lastName: commonSchemas.name.optional(),
  avatar: Joi.string().uri().optional(),
  preferences: Joi.object({
    emailNotifications: Joi.boolean().optional(),
    smsNotifications: Joi.boolean().optional(),
    marketingEmails: Joi.boolean().optional(),
    currency: Joi.string().length(3).optional(),
    language: Joi.string().length(2).optional(),
  }).optional(),
});

const createUserSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  firstName: commonSchemas.name,
  lastName: commonSchemas.name,
  role: Joi.string().valid('USER', 'ADMIN', 'SUPER_ADMIN').optional(),
});

const updateUserSchema = Joi.object({
  firstName: commonSchemas.name.optional(),
  lastName: commonSchemas.name.optional(),
  avatar: Joi.string().uri().optional(),
  role: Joi.string().valid('USER', 'ADMIN', 'SUPER_ADMIN').optional(),
  isEmailVerified: Joi.boolean().optional(),
});

const createAddressSchema = Joi.object({
  type: Joi.string().valid('billing', 'shipping').required(),
  firstName: commonSchemas.name,
  lastName: commonSchemas.name,
  street: Joi.string().min(5).max(100).required(),
  city: Joi.string().min(2).max(50).required(),
  state: Joi.string().min(2).max(50).required(),
  zipCode: Joi.string().min(3).max(10).required(),
  country: Joi.string().min(2).max(50).required(),
  phone: commonSchemas.phone,
  isDefault: Joi.boolean().optional(),
});

const updateAddressSchema = Joi.object({
  type: Joi.string().valid('billing', 'shipping').optional(),
  firstName: commonSchemas.name.optional(),
  lastName: commonSchemas.name.optional(),
  street: Joi.string().min(5).max(100).optional(),
  city: Joi.string().min(2).max(50).optional(),
  state: Joi.string().min(2).max(50).optional(),
  zipCode: Joi.string().min(3).max(10).optional(),
  country: Joi.string().min(2).max(50).optional(),
  phone: commonSchemas.phone,
  isDefault: Joi.boolean().optional(),
});

const idSchema = Joi.object({
  userId: commonSchemas.id,
});

const addressIdSchema = Joi.object({
  addressId: commonSchemas.id,
});

// User routes (authenticated)
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);
router.delete('/account', authenticate, userController.deleteAccount);

// Address routes
router.get('/addresses', authenticate, userController.getAddresses);
router.post('/addresses', authenticate, validate(createAddressSchema), userController.createAddress);
router.put('/addresses/:addressId', authenticate, validateParams(addressIdSchema), validate(updateAddressSchema), userController.updateAddress);
router.delete('/addresses/:addressId', authenticate, validateParams(addressIdSchema), userController.deleteAddress);

// Admin routes
router.get('/admin/users', authenticate, adminOnly, userController.getUsers);
router.get('/admin/users/:userId', authenticate, adminOnly, validateParams(idSchema), userController.getUserById);
router.post('/admin/users', authenticate, adminOnly, validate(createUserSchema), userController.createUser);
router.put('/admin/users/:userId', authenticate, adminOnly, validateParams(idSchema), validate(updateUserSchema), userController.updateUser);
router.delete('/admin/users/:userId', authenticate, adminOnly, validateParams(idSchema), userController.deleteUser);
router.get('/admin/stats', authenticate, adminOnly, userController.getUserStats);

export default router;
