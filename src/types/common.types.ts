// Common types used across the application

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ApiResponse is now exported from api.types.ts

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export type UserRole = 'user' | 'admin' | 'super_admin';
export type AuthProvider = 'local' | 'google';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export type PaymentMethod = 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'stripe' | 'CASH_ON_DELIVERY';
