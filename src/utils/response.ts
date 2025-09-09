import { Response } from 'express';
import { ApiResponse } from '@/types';

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 500,
  errors?: Record<string, string[]>
): void => {
  const response: ApiResponse = {
    success: false,
    error,
    ...(errors && { errors }),
  };
  res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  errors: Record<string, string[]>,
  message = 'Validation failed'
): void => {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };
  res.status(400).json(response);
};

export const sendUnauthorized = (res: Response, message = 'Unauthorized'): void => {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  res.status(401).json(response);
};

export const sendForbidden = (res: Response, message = 'Forbidden'): void => {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  res.status(403).json(response);
};

export const sendNotFound = (res: Response, message = 'Resource not found'): void => {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  res.status(404).json(response);
};

export const sendConflict = (res: Response, message = 'Resource already exists'): void => {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  res.status(409).json(response);
};
