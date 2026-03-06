/**
 * 医生账号控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { models } from '../models';
import { authService } from '../services/authService';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

// 添加医生验证 Schema
const createDoctorSchema = z.object({
  name: z.string().min(2).max(50),
  licenseNumber: z.string().min(15).max(20),
  department: z.string().min(2).max(50),
  email: z.string().email().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
});

export class DoctorController {
  private models: ReturnType<typeof models>;

  constructor(models: ReturnType<typeof models>) {
    this.models = models;
  }

  /**
   * 添加医生
   */
  public createDoctor = asyncHandler(async (req: Request, res: Response) => {
    const data = createDoctorSchema.parse(req.body);
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      throw new AppError('未找到医院信息', 400);
    }

    // 检查医院订阅状态
    const isValid = this.models.hospital.isSubscriptionValid(hospitalId);
    if (!isValid) {
      throw new AppError('医院订阅已过期', 403);
    }

    // 检查医生数量限制
    const doctorCount = this.models.hospital.getDoctorCount(hospitalId);
    const hospital = this.models.hospital.findById(hospitalId);

    if (hospital && doctorCount >= hospital.maxDoctors) {
      throw new AppError(`医生数量已达上限 (${hospital.maxDoctors})，请升级套餐`, 403);
    }

    // 检查执业证号是否已存在
    const existing = this.models.doctor.findByLicenseNumber(data.licenseNumber);
    if (existing) {
      throw new AppError('该执业证号已被使用', 400);
    }

    const doctor = this.models.doctor.create({
      ...data,
      hospitalId,
      accountStatus: 'active',
      canAccessPatientData: true,
    });

    // 生成登录 Token
    const token = authService.generateToken({
      userId: doctor.id,
      type: 'doctor',
      hospitalId: doctor.hospitalId,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        doctor,
        token,
      },
      message: '医生添加成功',
    };

    logger.info(`Doctor created: ${doctor.name} (${doctor.licenseNumber})`);
    res.status(201).json(response);
  });

  /**
   * 获取医生列表（医院）
   */
  public getDoctors = asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      throw new AppError('未找到医院信息', 400);
    }

    const doctors = this.models.doctor.findByHospitalId(hospitalId);

    const response: ApiResponse = {
      success: true,
      data: doctors,
    };

    res.json(response);
  });

  /**
   * 获取医生信息
   */
  public getDoctor = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = req.params.id;

    const doctor = this.models.doctor.findById(doctorId);
    if (!doctor) {
      throw new AppError('医生不存在', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: doctor,
    };

    res.json(response);
  });

  /**
   * 更新医生信息
   */
  public updateDoctor = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = req.params.id;

    const doctor = this.models.doctor.findById(doctorId);
    if (!doctor) {
      throw new AppError('医生不存在', 404);
    }

    const updated = this.models.doctor.update(doctorId, req.body);

    const response: ApiResponse = {
      success: true,
      data: updated,
      message: '更新成功',
    };

    res.json(response);
  });

  /**
   * 删除医生
   */
  public deleteDoctor = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = req.params.id;

    const doctor = this.models.doctor.findById(doctorId);
    if (!doctor) {
      throw new AppError('医生不存在', 404);
    }

    this.models.doctor.delete(doctorId);

    const response: ApiResponse = {
      success: true,
      message: '删除成功',
    };

    logger.info(`Doctor deleted: ${doctor.name}`);
    res.json(response);
  });

  /**
   * 搜索医生
   */
  public searchDoctors = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new AppError('搜索关键词不能为空', 400);
    }

    const doctors = this.models.doctor.searchDoctors(q);

    const response: ApiResponse = {
      success: true,
      data: doctors,
    };

    res.json(response);
  });

  /**
   * 激活/暂停医生账号
   */
  public toggleDoctorStatus = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = req.params.id;
    const { status } = req.body;

    if (status === 'active') {
      const doctor = this.models.doctor.activateDoctor(doctorId);
      const response: ApiResponse = {
        success: true,
        data: doctor,
        message: '医生已激活',
      };
      res.json(response);
    } else if (status === 'suspended') {
      const doctor = this.models.doctor.suspendDoctor(doctorId);
      const response: ApiResponse = {
        success: true,
        data: doctor,
        message: '医生已暂停',
      };
      res.json(response);
    } else {
      throw new AppError('无效的状态', 400);
    }
  });
}

export function createDoctorController(models: ReturnType<typeof models>) {
  return new DoctorController(models);
}