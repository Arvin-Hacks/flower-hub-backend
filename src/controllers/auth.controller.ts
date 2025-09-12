import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error';
import { AuthenticatedRequest } from '../types';
import { ensureUser } from '../middleware/auth';

export const authController = {
  // Register new user
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'User registered successfully', 201);
  }),

  // Login user
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  }),

  // Refresh token
  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refreshToken(req.body);
    sendSuccess(res, result, 'Token refreshed successfully');
  }),

  // Logout user
  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    sendSuccess(res, null, 'Logout successful');
  }),

  // Logout from all devices
  logoutAll: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await authService.logoutAll(ensureUser(req));
    sendSuccess(res, null, 'Logged out from all devices');
  }),

  // Forgot password
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body);
    sendSuccess(res, null, 'Password reset email sent if account exists');
  }),

  // Reset password
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body);
    sendSuccess(res, null, 'Password reset successfully');
  }),

  // Change password
  changePassword: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await authService.changePassword(ensureUser(req), req.body);
    sendSuccess(res, null, 'Password changed successfully');
  }),

  // Verify email
  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    await authService.verifyEmail(req.body);
    sendSuccess(res, null, 'Email verified successfully');
  }),

  // Resend verification email
  resendVerification: asyncHandler(async (req: Request, res: Response) => {
    await authService.resendVerification(req.body);
    sendSuccess(res, null, 'Verification email sent');
  }),

  // Get current user
  me: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    sendSuccess(res, req.user, 'User profile retrieved');
  }),

  // Google OAuth - initiate authentication
  googleAuth: asyncHandler(async (req: Request, res: Response) => {
    // This will redirect to Google
    // The actual logic is handled by passport middleware
  }),

  // Google OAuth - handle callback
  googleCallback: asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login?error=authentication_failed`);
      }

      // Generate tokens for the user
      const result = await authService.googleAuth(user);
      
      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${result.tokens.accessToken}&refresh=${result.tokens.refreshToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=authentication_failed`);
    }
  }),
};
