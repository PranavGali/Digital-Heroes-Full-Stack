import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  code?: number; // MongoDB duplicate key code
  errors?: any;  // Mongoose validation errors
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log error details for developer diagnostics
  console.error(`[Error Handler] path: ${req.path} - error:`, err);

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found or invalid format.';
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const validationMessages = Object.values(err.errors || {})
      .map((e: any) => e.message)
      .join(', ');
    message = `Validation Error: ${validationMessages}`;
  }

  // Handle MongoDB Duplicate Key Error (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Email address is already in use.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
