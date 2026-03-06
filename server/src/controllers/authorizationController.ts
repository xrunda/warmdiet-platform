/**
 * 授权管理控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { models } from '../models';
import { ApiResponse, AuthorizationType, DataRange } from '../types';
import { logger } from '../utils/logger';

// 创建授权验证 Schema
const createAuthorizationSchema = z.object({
  doctorId: z.string(),
  patientId: z.string(),
  authorizationType: z.array(z.enum(['meal_records', 'health_reports', 'chat_logs'])),
  scopeDataRange: z.enum(['recent_7d', 'recent_30d', 'recent_90d', 'all']),
  scopeDataStart: z.string(),
  scopeDataEnd: z.string().optional(),
  expiresInDays: z.number().optional(),
});

export class AuthorizationController {
  private models: ReturnType<typeof models>;

  constructor(models: ReturnType<typeof models>) {
    this.models = models;
  }

  /**
   * 创建授权
   */
  public createAuthorization = asyncHandler(async (req: Request, res: Response) => {
    const data = createAuthorizationSchema.parse(req.body);

    // 检查医生是否存在
    const doctor = this.models.doctor.findById(data.doctorId);
    if (!doctor) {
      throw new AppError('医生不存在', 404);
    }

    // 检查患者是否存在
    const patient = this.models.patient.findById(data.patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    // 检查医院订阅状态
    const isValid = this.models.hospital.isSubscriptionValid(doctor.hospitalId);
    if (!isValid) {
      throw new AppError('医院订阅已过期，医生无法访问数据', 403);
    }

    // 计算过期时间
    let expiresAt: string | undefined;
    if (data.expiresInDays && data.expiresInDays !== 99999) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + data.expiresInDays);
      expiresAt = expiryDate.toISOString();
    }

    // 创建授权
    const authorization = this.models.authorization.create({
      ...data,
      expiresAt,
      status: 'active',
      authorizedAt: new Date().toISOString(),
      ipAddress: req.ip,
      deviceId: req.headers['user-agent'],
    });

    const response: ApiResponse = {
      success: true,
      data: authorization,
      message: '授权创建成功',
    };

    logger.info(`Authorization created: ${data.doctorId} -> ${data.patientId}`);
    res.status(201).json(response);
  });

  /**
   * 获取患者的授权列表
   */
  public getPatientAuthorizations = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;

    const authorizations = this.models.authorization.findByPatientId(patientId);

    const response: ApiResponse = {
      success: true,
      data: authorizations,
    };

    res.json(response);
  });

  /**
   * 获取患者的授权列表（包含医生信息），用于家属端 H5 展示
   */
  public getPatientAuthorizationsDetailed = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;

    const authorizations = this.models.authorization.findByPatientId(patientId);

    const detailed = authorizations.map((auth) => {
      const doctor = this.models.doctor.findById(auth.doctorId);
      const hospital = doctor ? this.models.hospital.findById(doctor.hospitalId) : undefined;

      return {
        id: auth.id,
        doctorId: auth.doctorId,
        doctorName: doctor?.name || '',
        hospital: hospital?.hospitalName || '',
        department: doctor?.department || '',
        licenseNumber: doctor?.licenseNumber || '',
        patientId: auth.patientId,
        authorizationType: auth.authorizationType,
        authorizedAt: auth.authorizedAt,
        expiresAt: auth.expiresAt,
        status: auth.status,
        scope: {
          startDate: auth.scopeDataStart,
          endDate: auth.scopeDataEnd,
          dataRange: auth.scopeDataRange,
        },
        ipAddress: auth.ipAddress,
        deviceId: auth.deviceId,
        lastAccessedAt: auth.lastAccessedAt,
        accessCount: auth.accessCount,
      };
    });

    const response: ApiResponse = {
      success: true,
      data: detailed,
    };

    res.json(response);
  });

  /**
   * 获取医生的授权列表
   */
  public getDoctorAuthorizations = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = req.params.doctorId;

    const authorizations = this.models.authorization.findByDoctorId(doctorId);

    const response: ApiResponse = {
      success: true,
      data: authorizations,
    };

    res.json(response);
  });

  /**
   * 获取授权详情
   */
  public getAuthorization = asyncHandler(async (req: Request, res: Response) => {
    const authorizationId = req.params.id;

    const authorization = this.models.authorization.findById(authorizationId);
    if (!authorization) {
      throw new AppError('授权不存在', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: authorization,
    };

    res.json(response);
  });

  /**
   * 撤销授权
   */
  public revokeAuthorization = asyncHandler(async (req: Request, res: Response) => {
    const authorizationId = req.params.id;

    const authorization = this.models.authorization.findById(authorizationId);
    if (!authorization) {
      throw new AppError('授权不存在', 404);
    }

    if (authorization.status !== 'active') {
      throw new AppError('授权已撤销或过期', 400);
    }

    const revoked = this.models.authorization.revoke(authorizationId);

    const response: ApiResponse = {
      success: true,
      data: revoked,
      message: '授权已撤销',
    };

    logger.info(`Authorization revoked: ${authorizationId}`);
    res.json(response);
  });

  /**
   * 延长授权
   */
  public extendAuthorization = asyncHandler(async (req: Request, res: Response) => {
    const authorizationId = req.params.id;
    const { days } = req.body;

    if (!days || days <= 0) {
      throw new AppError('延长时间必须大于 0', 400);
    }

    const authorization = this.models.authorization.findById(authorizationId);
    if (!authorization) {
      throw new AppError('授权不存在', 404);
    }

    const extended = this.models.authorization.extend(authorizationId, days);

    const response: ApiResponse = {
      success: true,
      data: extended,
      message: '授权已延长',
    };

    logger.info(`Authorization extended: ${authorizationId} by ${days} days`);
    res.json(response);
  });

  /**
   * 验证访问权限
   */
  public verifyAccess = asyncHandler(async (req: Request, res: Response) => {
    const { doctorId, patientId, dataType } = req.query;

    if (!doctorId || !patientId || !dataType) {
      throw new AppError('缺少必要参数', 400);
    }

    const hasAccess = this.models.authorization.hasAccess(
      doctorId as string,
      patientId as string,
      dataType as string
    );

    const response: ApiResponse = {
      success: true,
      data: {
        allowed: hasAccess,
        reason: hasAccess ? '授权有效' : '无权访问',
      },
    };

    res.json(response);
  });
}

export function createAuthorizationController(models: ReturnType<typeof models>) {
  return new AuthorizationController(models);
}