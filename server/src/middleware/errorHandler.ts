/**
 * 错误处理中间件
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const response: ApiResponse = {
    success: false,
  };

  if (err instanceof AppError) {
    response.error = err.message;
    response.message = err.message;
    res.status(err.statusCode).json(response);
  } else {
    // 未知错误
    console.error('Unexpected error:', err);
    response.error = 'Internal server error';
    response.message = '服务器内部错误';
    res.status(500).json(response);
  }
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: 'Not Found',
    message: `路径 ${req.method} ${req.path} 不存在`,
  };
  res.status(404).json(response);
}

/**
 * 异步路由包装器
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}