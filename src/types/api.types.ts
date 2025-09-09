import { Request, Response } from 'express';
import { User } from './user.types';

// Extended Request interface with user information
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// API Response types
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Middleware types
export interface AuthMiddleware {
  (req: AuthenticatedRequest, res: Response, next: () => void): void;
}

export interface ValidationMiddleware {
  (req: Request, res: Response, next: () => void): void;
}

// Controller types
export interface Controller {
  [key: string]: (req: Request | AuthenticatedRequest, res: Response) => Promise<void>;
}

// Service types
export interface Service {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

// Database types
export interface DatabaseConfig {
  url: string;
  ssl?: boolean;
  logging?: boolean;
}

// Email types
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// File upload types
export interface UploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  destination: string;
}

// Search types
export interface SearchParams {
  query: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  filters: Record<string, unknown>;
}
