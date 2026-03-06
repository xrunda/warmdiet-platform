/**
 * 患者账号控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { models } from '../models';
import { authService } from '../services/authService';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

// 创建患者验证 Schema
const createPatientSchema = z.object({
  name: z.string().min(2).max(50),
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female']),
  email: z.string().email().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
});

export class PatientController {
  private models: ReturnType<typeof models>;

  constructor(models: ReturnType<typeof models>) {
    this.models = models;
  }

  /**
   * 创建患者
   */
  public createPatient = asyncHandler(async (req: Request, res: Response) => {
    const data = createPatientSchema.parse(req.body);

    // 检查邮箱是否已存在
    if (data.email) {
      const existing = this.models.patient.findByEmail(data.email);
      if (existing) {
        throw new AppError('该邮箱已被使用', 400);
      }
    }

    const patient = this.models.patient.create(data);

    const response: ApiResponse = {
      success: true,
      data: patient,
      message: '患者创建成功',
    };

    logger.info(`Patient created: ${patient.name}`);
    res.status(201).json(response);
  });

  /**
   * 获取患者信息
   */
  public getPatient = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;

    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: patient,
    };

    res.json(response);
  });

  /**
   * 更新患者信息
   */
  public updatePatient = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;

    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    const updated = this.models.patient.update(patientId, req.body);

    const response: ApiResponse = {
      success: true,
      data: updated,
      message: '更新成功',
    };

    res.json(response);
  });

  /**
   * 删除患者
   */
  public deletePatient = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;

    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    this.models.patient.delete(patientId);

    const response: ApiResponse = {
      success: true,
      message: '删除成功',
    };

    logger.info(`Patient deleted: ${patient.name}`);
    res.json(response);
  });

  /**
   * 搜索患者
   */
  public searchPatients = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new AppError('搜索关键词不能为空', 400);
    }

    const patients = this.models.patient.searchPatients(q);

    const response: ApiResponse = {
      success: true,
      data: patients,
    };

    res.json(response);
  });
}

export function createPatientController(models: ReturnType<typeof models>) {
  return new PatientController(models);
}