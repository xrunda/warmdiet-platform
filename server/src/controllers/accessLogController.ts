/**
 * 访问日志控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { models } from '../models';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

// 查询参数验证 Schema
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class AccessLogController {
  private models: ReturnType<typeof models>;

  constructor(models: ReturnType<typeof models>) {
    this.models = models;
  }

  /**
   * 获取医院的访问日志
   */
  public getHospitalLogs = asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.params.hospitalId;
    const query = querySchema.parse(req.query);

    // 验证权限：只能查看自己医院的日志
    if (req.user?.type === 'doctor' && req.user?.hospitalId !== hospitalId) {
      throw new AppError('无权查看此医院的访问日志', 403);
    }

    const offset = (query.page - 1) * query.limit;
    const logs = this.models.accessLog.findByHospitalId(hospitalId, {
      limit: query.limit,
      offset,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const totalCount = this.models.accessLog.countByHospitalId(
      hospitalId,
      query.startDate,
      query.endDate
    );

    const response: ApiResponse = {
      success: true,
      data: logs,
    };

    res.json(response);
  });

  /**
   * 获取医生的访问日志
   */
  public getDoctorLogs = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = req.params.doctorId;
    const query = querySchema.parse(req.query);

    // 验证权限：医生只能查看自己的日志
    if (req.user?.type === 'doctor' && req.user?.userId !== doctorId) {
      throw new AppError('无权查看其他医生的访问日志', 403);
    }

    const offset = (query.page - 1) * query.limit;
    const logs = this.models.accessLog.findByDoctorId(doctorId, {
      limit: query.limit,
      offset,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const totalCount = this.models.accessLog.countByDoctorId(
      doctorId,
      query.startDate,
      query.endDate
    );

    const response: ApiResponse = {
      success: true,
      data: logs,
    };

    res.json(response);
  });

  /**
   * 获取患者的访问日志
   */
  public getPatientLogs = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;
    const query = querySchema.parse(req.query);

    // 验证权限：患者只能查看自己的日志，医生需要授权
    if (req.user?.type === 'patient' && req.user?.userId !== patientId) {
      throw new AppError('无权查看其他患者的访问日志', 403);
    }

    const offset = (query.page - 1) * query.limit;
    const logs = this.models.accessLog.findByPatientId(patientId, {
      limit: query.limit,
      offset,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const response: ApiResponse = {
      success: true,
      data: logs,
    };

    res.json(response);
  });

  /**
   * 获取医院访问统计
   */
  public getHospitalStats = asyncHandler(async (req: Request, res: Response) => {
    const hospitalId = req.params.hospitalId;
    const { days } = req.query;

    // 验证权限
    if (req.user?.type === 'doctor' && req.user?.hospitalId !== hospitalId) {
      throw new AppError('无权查看此医院的统计', 403);
    }

    const daysNum = days ? Number(days) : 30;

    const dailyStats = this.models.accessLog.getDailyStats(hospitalId, daysNum);
    const dataTypeDistribution = this.models.accessLog.getDataTypeDistribution(hospitalId);
    const topPatients = this.models.accessLog.getTopPatients(hospitalId);

    const response: ApiResponse = {
      success: true,
      data: {
        period: `${daysNum}天`,
        dailyStats,
        dataTypeDistribution,
        topPatients,
      },
    };

    res.json(response);
  });

  /**
   * 获取医生访问统计
   */
  public getDoctorStats = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = req.params.doctorId;
    const { days } = req.query;

    // 验证权限：只能查看自己的统计
    if (req.user?.type === 'doctor' && req.user?.userId !== doctorId) {
      throw new AppError('无权查看其他医生的统计', 403);
    }

    const daysNum = days ? Number(days) : 30;

    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString();
    const totalCount = this.models.accessLog.countByDoctorId(doctorId, startDate);

    const response: ApiResponse = {
      success: true,
      data: {
        period: `${daysNum}天`,
        totalAccesses: totalCount,
      },
    };

    res.json(response);
  });

  /**
   * 手动记录访问日志（供控制器调用）
   */
  public static logAccess(
    models: ReturnType<typeof models>,
    doctorId: string,
    patientId: string,
    hospitalId: string,
    dataType: string
  ): void {
    try {
      models.accessLog.logAccess({
        doctorId,
        patientId,
        hospitalId,
        dataType,
      });
      logger.debug(`Access logged: ${doctorId} -> ${patientId} (${dataType})`);
    } catch (error) {
      logger.error('Failed to log access:', error);
    }
  }
}

export function createAccessLogController(models: ReturnType<typeof models>) {
  return new AccessLogController(models);
}