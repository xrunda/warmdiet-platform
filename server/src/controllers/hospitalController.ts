/**
 * 医院账号控制器
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { models } from '../models';
import { authService } from '../services/authService';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

// 注册验证 Schema
const registerSchema = z.object({
  hospitalName: z.string().min(2).max(100),
  hospitalId: z.string().length(18), // 统一社会信用代码
  contactPerson: z.string().min(2).max(50),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/),
  contactEmail: z.string().email(),
  planType: z.enum(['basic', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
  password: z.string().min(8),
});

// 登录验证 Schema
const loginSchema = z.object({
  hospitalId: z.string(),
  password: z.string(),
});

export class HospitalController {
  private models: ReturnType<typeof models>;

  constructor(models: ReturnType<typeof models>) {
    this.models = models;
  }

  /**
   * 医院注册
   */
  public register = asyncHandler(async (req: Request, res: Response) => {
    // 验证请求数据
    const data = registerSchema.parse(req.body);

    // 检查医院是否已注册
    const existing = this.models.hospital.findByHospitalId(data.hospitalId);
    if (existing) {
      throw new AppError('该医院已注册', 400);
    }

    // 计算订阅信息
    const now = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30); // 默认30天试用

    let maxDoctors = 5;
    if (data.planType === 'professional') {
      maxDoctors = 20;
    } else if (data.planType === 'enterprise') {
      maxDoctors = 50;
    }

    // 创建医院账号
    const hospital = this.models.hospital.create({
      hospitalName: data.hospitalName,
      hospitalId: data.hospitalId,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      planType: data.planType,
      subscriptionStatus: 'active',
      maxDoctors,
      subscriptionStart: now.toISOString(),
      subscriptionEnd: subscriptionEnd.toISOString(),
      billingCycle: data.billingCycle,
    });

    // 生成 JWT Token
    const token = authService.generateToken({
      userId: hospital.id,
      type: 'hospital',
      hospitalId: hospital.id,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        hospital,
        token,
      },
      message: '注册成功',
    };

    logger.info(`Hospital registered: ${hospital.hospitalName} (${hospital.hospitalId})`);
    res.status(201).json(response);
  });

  /**
   * 医院登录
   */
  public login = asyncHandler(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);

    const hospital = this.models.hospital.findByHospitalId(data.hospitalId);
    if (!hospital) {
      throw new AppError('医院账号不存在', 401);
    }

    // 验证密码（简化版，实际应该存储密码）
    // TODO: 添加密码字段到数据库
    const token = authService.generateToken({
      userId: hospital.id,
      type: 'hospital',
      hospitalId: hospital.id,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        hospital,
        token,
      },
      message: '登录成功',
    };

    logger.info(`Hospital logged in: ${hospital.hospitalName}`);
    res.json(response);
  });

  /**
   * 获取医院信息
   */
  public getHospital = asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.params.id;

    const hospital = this.models.hospital.findById(hospitalId);
    if (!hospital) {
      throw new AppError('医院不存在', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: hospital,
    };

    res.json(response);
  });

  /**
   * 更新医院信息
   */
  public updateHospital = asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.params.id;

    const hospital = this.models.hospital.findById(hospitalId);
    if (!hospital) {
      throw new AppError('医院不存在', 404);
    }

    const updatedHospital = this.models.hospital.update(hospitalId, req.body);

    const response: ApiResponse = {
      success: true,
      data: updatedHospital,
      message: '更新成功',
    };

    res.json(response);
  });

  /**
   * 获取订阅状态
   */
  public getSubscription = asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.params.id;

    const hospital = this.models.hospital.findById(hospitalId);
    if (!hospital) {
      throw new AppError('医院不存在', 404);
    }

    const doctorCount = this.models.hospital.getDoctorCount(hospitalId);
    const isValid = this.models.hospital.isSubscriptionValid(hospitalId);

    const response: ApiResponse = {
      success: true,
      data: {
        ...hospital,
        currentDoctorCount: doctorCount,
        doctorRemaining: hospital.maxDoctors - doctorCount,
        isValid,
      },
    };

    res.json(response);
  });

  /**
   * 升级套餐
   */
  public upgradePlan = asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.params.id;
    const { planType } = req.body;

    let maxDoctors = 5;
    if (planType === 'professional') {
      maxDoctors = 20;
    } else if (planType === 'enterprise') {
      maxDoctors = 50;
    }

    const updated = this.models.hospital.changePlan(hospitalId, planType, maxDoctors);

    const response: ApiResponse = {
      success: true,
      data: updated,
      message: '套餐升级成功',
    };

    res.json(response);
  });
}

export function createHospitalController(models: ReturnType<typeof models>) {
  return new HospitalController(models);
}