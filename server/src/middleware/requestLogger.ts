/**
 * 请求日志中间件
 */

import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

/**
 * 自定义日志格式
 */
morgan.token('body', (req: Request) => {
  return JSON.stringify(req.body);
});

/**
 * 开发环境日志中间件
 */
export const developmentLogger = morgan('dev');

/**
 * 生产环境日志中间件
 */
export const productionLogger = morgan('combined');

/**
 * 简化的日志格式
 */
export const simpleLogger = morgan(':method :url :status :res[content-length] - :response-time ms');

/**
 * 根据环境选择日志中间件
 */
export function getLoggerMiddleware() {
  if (process.env.NODE_ENV === 'production') {
    return productionLogger;
  }
  return developmentLogger;
}