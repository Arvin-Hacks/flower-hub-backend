import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../utils/validation';
import { commonSchemas } from '../utils/validation';
import Joi from 'joi';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  email: commonSchemas.email,
  password: Joi.string().required(),
});

const signupSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  firstName: commonSchemas.name,
  lastName: commonSchemas.name,
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: commonSchemas.email,
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: commonSchemas.password,
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: commonSchemas.password,
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

const resendVerificationSchema = Joi.object({
  email: commonSchemas.email,
});

// Public routes
router.post('/register', validate(signupSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password',validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password',validate(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), authController.resendVerification);

// Protected routes
router.post('/logout', validate(refreshTokenSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/me', authenticate, authController.me);

export default router;
