import { prisma } from '../database';
import { 
  hashPassword, 
  comparePassword, 
  generateTokens, 
  generateAccessToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken
} from '../utils/auth';
import { 
  LoginCredentials, 
  SignupCredentials, 
  AuthResponse, 
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest
} from '../types';
import { AppError } from '../middleware/error';
// import { generateSlug } from '../utils/helpers';
import { logger } from '../utils/logger';

export const authService = {
  // Register new user
  async register(credentials: SignupCredentials): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = credentials;

    console.log('credentials', credentials);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'USER',
        provider: 'LOCAL',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        avatar: true,
        provider: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar || '',
      provider: user.provider,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    return {
      user: {
        ...user,
        avatar: user.avatar || '',
      },
      tokens,
    };
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password || '');
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar || '',
      provider: user.provider,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar || '',
        provider: user.provider,
      },
      tokens,
    };
  },

  // Refresh token
  async refreshToken(request: RefreshTokenRequest): Promise<{ accessToken: string }> {
    const { refreshToken } = request;

    // Find refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      firstName: tokenRecord.user.firstName,
      lastName: tokenRecord.user.lastName,
      role: tokenRecord.user.role,
      isEmailVerified: tokenRecord.user.isEmailVerified,
      avatar: tokenRecord.user.avatar || '',
      provider: tokenRecord.user.provider,
    });

    return { accessToken };
  },

  // Logout user
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    logger.info('User logged out successfully');
  },

  // Logout from all devices
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    logger.info('User logged out from all devices', { userId });
  },

  // Forgot password
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    const { email } = request;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    const resetToken = generatePasswordResetToken(); // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    
    // Store reset token (you might want to create a separate table for this)
    // For now, we'll use a simple approach
    logger.info('Password reset requested', { userId: user.id, email: user.email });

    // TODO: Send email with reset token
  },

  // Reset password
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    const { token, password } = request; // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars

    try {
      verifyPasswordResetToken(token);
    } catch (error) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // TODO: Implement password reset logic
    // This would involve storing the reset token and verifying it
  },

  // Change password
  async changePassword(userId: string, request: ChangePasswordRequest): Promise<void> {
    const { currentPassword, newPassword } = request;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password || '');
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    logger.info('Password changed successfully', { userId });
  },

  // Verify email
  async verifyEmail(request: VerifyEmailRequest): Promise<void> {
    const { token } = request;

    try {
      verifyEmailVerificationToken(token);
    } catch (error) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    // TODO: Implement email verification logic
  },

  // Resend verification email
  async resendVerification(request: ResendVerificationRequest): Promise<void> {
    const { email } = request;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    const verificationToken = generateEmailVerificationToken(); // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    
    logger.info('Verification email requested', { userId: user.id, email: user.email });

    // TODO: Send verification email
  },

  // Google OAuth login/signup
  async googleAuth(user: any): Promise<AuthResponse> {
    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar || '',
      provider: user.provider,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    logger.info('Google OAuth successful', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar || '',
        provider: user.provider,
      },
      tokens,
    };
  },
};
