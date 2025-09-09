import { Request, Response, NextFunction } from 'express';

// Type for async route handlers
type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wrapper function to catch async errors in Express route handlers
 * This prevents the need to wrap every async route handler in try-catch blocks
 * 
 * @param fn - The async function to wrap
 * @returns Express middleware function
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Execute the async function and catch any errors
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
