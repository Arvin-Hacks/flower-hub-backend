import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthTokens, AuthUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate access token
export const generateAccessToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
  );
};

// Generate both tokens
export const generateTokens = (user: AuthUser): AuthTokens => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
  };
};

// Verify access token
export const verifyAccessToken = (token: string): { userId: string; email: string; role: string } => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: string; email: string; role: string } => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; email: string; role: string };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// Extract token from header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
};

// Generate email verification token
export const generateEmailVerificationToken = (): string => {
  return jwt.sign(
    { type: 'email_verification' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Generate password reset token
export const generatePasswordResetToken = (): string => {
  return jwt.sign(
    { type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Verify email verification token
export const verifyEmailVerificationToken = (token: string): { userId: string; email: string; type: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; type: string };
    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired email verification token');
  }
};

// Verify password reset token
export const verifyPasswordResetToken = (token: string): { userId: string; email: string; type: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; type: string };
    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired password reset token');
  }
};
