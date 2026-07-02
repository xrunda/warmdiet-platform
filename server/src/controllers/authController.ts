/**
 * 认证控制器
 * 提供 REST API 接口：注册、登录、获取用户信息、修改密码
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import type { Models } from '../models';
import { authService } from '../services/authService';
import { JWTPayload } from '../types';
import { logger } from '../utils/logger';

// 注册验证 Schema
const registerSchema = z.object({
  phone: z.string().min(11, '手机号至少11位').max(11, '手机号最多11位'),
  password: z.string().min(6, '密码至少6位').max(20, '密码最多20位'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最多50字符'),
  age: z.number().int().min(1).max(150).default(65),
  gender: z.enum(['male', 'female']).default('female'),
});

// 登录验证 Schema
const loginSchema = z.object({
  phone: z.string().min(11, '手机号至少11位').max(11, '手机号最多11位'),
  password: z.string().min(6, '密码至少6位'),
});

// 修改密码验证 Schema
const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, '旧密码至少6位'),
  newPassword: z.string().min(6, '新密码至少6位').max(20, '新密码最多20位'),
});

export class AuthController {
  constructor(private models: Models) {}

  /**
   * POST /api/auth/register
   * 患者注册
   */
  public register = asyncHandler(async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);

    // 检查手机号是否已存在
    const existingPatient = this.models.patient.findByPhone(payload.phone);
    if (existingPatient) {
      throw new AppError('该手机号已注册', 400);
    }

    // 加密密码
    const passwordHash = await authService.hashPassword(payload.password);

    // 创建患者账号
    const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const patient = this.models.patient.create({
      id: patientId,
      name: payload.name,
      age: payload.age,
      gender: payload.gender,
      phone: payload.phone,
      passwordHash,
      avatar: null,
    } as any);

    // 创建默认饮食偏好
    this.models.patientPreferences.create({
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: patient.id,
      tastePreferences: '[]',
      likedFoods: '[]',
      dislikedFoods: '[]',
    } as any);

    // 生成 JWT Token
    const tokenPayload: JWTPayload = {
      userId: patient.id,
      type: 'patient',
    };
    const token = authService.generateToken(tokenPayload);

    res.status(201).json({
      success: true,
      data: {
        token,
        patientId: patient.id,
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
      },
      message: '注册成功',
    });
  });

  /**
   * POST /api/auth/login
   * 患者登录
   */
  public login = asyncHandler(async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);
    logger.info(`患者登录尝试: phone=${payload.phone}`);

    // 查找患者
    const patient = this.models.patient.findByPhone(payload.phone);
    if (!patient) {
      logger.warn(`患者登录失败: 手机号不存在 phone=${payload.phone}`);
      throw new AppError('手机号或密码错误', 401);
    }

    // 验证密码
    if (!patient.passwordHash) {
      throw new AppError('账号异常，请联系管理员', 500);
    }
    
    const isValid = await authService.verifyPassword(payload.password, patient.passwordHash);
    if (!isValid) {
      logger.warn(`患者登录失败: 密码错误 phone=${payload.phone}, patientId=${patient.id}`);
      throw new AppError('手机号或密码错误', 401);
    }
    logger.info(`患者登录成功: phone=${payload.phone}, patientId=${patient.id}`);

    // 生成 JWT Token
    const tokenPayload: JWTPayload = {
      userId: patient.id,
      type: 'patient',
    };
    const token = authService.generateToken(tokenPayload);

    res.json({
      success: true,
      data: {
        token,
        patientId: patient.id,
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
      },
      message: '登录成功',
    });
  });

  /**
   * GET /api/auth/profile
   * 获取当前用户信息
   */
  public getProfile = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) {
      throw new AppError('未认证', 401);
    }

    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('用户不存在', 404);
    }

    res.json({
      success: true,
      data: {
        patientId: patient.id,
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        avatar: patient.avatar,
        createdAt: patient.createdAt,
      },
    });
  });

  /**
   * PUT /api/auth/change-password
   * 修改密码
   */
  public changePassword = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) {
      throw new AppError('未认证', 401);
    }

    const payload = changePasswordSchema.parse(req.body);

    // 查找患者
    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('用户不存在', 404);
    }

    // 验证旧密码
    if (!patient.passwordHash) {
      throw new AppError('账号异常，请联系管理员', 500);
    }

    const isValid = await authService.verifyPassword(payload.oldPassword, patient.passwordHash);
    if (!isValid) {
      throw new AppError('旧密码错误', 400);
    }

    // 检查新旧密码是否相同
    if (payload.oldPassword === payload.newPassword) {
      throw new AppError('新密码不能与旧密码相同', 400);
    }

    // 更新密码
    const newPasswordHash = await authService.hashPassword(payload.newPassword);
    this.models.patient.update(patientId, { passwordHash: newPasswordHash } as any);

    res.json({
      success: true,
      message: '密码修改成功',
    });
  });

  /**
   * POST /api/auth/logout
   * 退出登录（前端清除 token 即可，服务端无需处理）
   */
  public logout = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      message: '已退出登录',
    });
  });
}

export function createAuthController(models: Models) {
  return new AuthController(models);
}
