import { randomBytes, createHash } from 'crypto';
// import { promisify } from 'util';

// Generate random string
export const generateRandomString = (length: number): string => {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// Generate order number
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = generateRandomString(4).toUpperCase();
  return `FH-${timestamp.slice(-6)}-${random}`;
};

// Generate slug from string
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Hash string
export const hashString = async (text: string): Promise<string> => {
  const hash = createHash('sha256');
  hash.update(text);
  return hash.digest('hex');
};

// Calculate pagination
export const calculatePagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    offset,
  };
};

// Format currency
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Calculate tax
export const calculateTax = (amount: number, taxRate = 0.08): number => {
  return Math.round(amount * taxRate * 100) / 100;
};

// Calculate shipping
export const calculateShipping = (amount: number): number => {
  if (amount >= 50) return 0; // Free shipping over $50
  if (amount >= 25) return 5.99; // Standard shipping
  return 9.99; // Express shipping
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize string
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Sleep function
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) {
        throw lastError;
      }
      await sleep(delay * attempt);
    }
  }
  
  throw lastError ?? new Error('Retry failed');
};
