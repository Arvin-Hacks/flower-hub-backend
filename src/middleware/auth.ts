import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '@/utils/auth';
import { sendUnauthorized, sendForbidden } from '@/utils/response';
import { prisma } from '@/database';
import { AuthenticatedRequest } from '@/types';
import { UserRole } from '@/types/common.types';

// Helper function to ensure user exists
export const ensureUser = (req: AuthenticatedRequest): string => {
  if (!req.user?.id) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
};

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      sendUnauthorized(res, 'Access token is required');
      return;
    }

    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      next();
      return;
    }

    const decoded = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        avatar: true,
      },
    });

    if (user) {
      (req as AuthenticatedRequest).user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!(req as AuthenticatedRequest).user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    if (!roles.includes((req as AuthenticatedRequest).user!.role)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!(req as AuthenticatedRequest).user) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }

  const user = (req as AuthenticatedRequest).user!;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    sendForbidden(res, 'Admin access required');
    return;
  }

  next();
};

// Super admin only middleware
export const superAdminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!(req as AuthenticatedRequest).user) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }

  const user = (req as AuthenticatedRequest).user!;
  if (user.role !== 'super_admin') {
    sendForbidden(res, 'Super admin access required');
    return;
  }

  next();
};

// Email verification middleware
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!(req as AuthenticatedRequest).user) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }

  const user = (req as AuthenticatedRequest).user!;
  if (!user.isEmailVerified) {
    sendForbidden(res, 'Email verification required');
    return;
  }

  next();
};
