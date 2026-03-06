/**
 * JWT 认证中间件
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AppError, asyncHandler } from './errorHandler';
import { logger } from '../utils/logger';
import { JWTPayload } from '../types';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * JWT 认证中间件
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('未提供认证令牌', 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const payload = authService.verifyToken(token);

  if (!payload) {
    throw new AppError('无效或过期的认证令牌', 401);
  }

  req.user = payload;
  logger.debug(`User authenticated: ${payload.userId} (${payload.type})`);

  next();
}

/**
 * 可选认证中间件（不强制要求登录）
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    if (payload) {
      req.user = payload;
    }
  }

  next();
}

/**
 * 检查用户类型
 */
export function checkUserType(...allowedTypes: ('hospital' | 'doctor' | 'patient')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    if (!allowedTypes.includes(req.user.type)) {
      throw new AppError('无权访问此资源', 403);
    }

    next();
  };
}

/**
 * 医院认证中间件
 */
export const authenticateHospital = [authenticate, checkUserType('hospital')];

/**
 * 医生认证中间件
 */
export const authenticateDoctor = [authenticate, checkUserType('doctor')];

/**
 * 患者认证中间件
 */
export const authenticatePatient = [authenticate, checkUserType('patient')];

/**
 * 医生或医院认证中间件
 */
export const authenticateDoctorOrHospital = [authenticate, checkUserType('doctor', 'hospital')];

/**
 * 医生或患者认证中间件
 * 用于既允许医生也允许患者访问的场景（例如共同查看餐食记录）
 */
export const authenticateDoctorOrPatient = [authenticate, checkUserType('doctor', 'patient')];