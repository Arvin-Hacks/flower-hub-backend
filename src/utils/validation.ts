import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { sendValidationError } from './response';

// Common validation schemas
export const commonSchemas = {
  id: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-()]+$/).optional(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  },
};

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors: Record<string, string[]> = {};
      
      error.details.forEach((detail) => {
        const field = detail.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(detail.message);
      });
      
      sendValidationError(res, errors);
      return;
    }
    
    req.body = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors: Record<string, string[]> = {};
      
      error.details.forEach((detail) => {
        const field = detail.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(detail.message);
      });
      
      sendValidationError(res, errors);
      return;
    }
    
    req.query = value;
    next();
  };
};

// Params validation middleware
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const errors: Record<string, string[]> = {};
      
      error.details.forEach((detail) => {
        const field = detail.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(detail.message);
      });
      
      sendValidationError(res, errors);
      return;
    }
    
    req.params = value;
    next();
  };
};
