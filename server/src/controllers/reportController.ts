/**
 * 健康报告控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { models } from '../models';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

// 生成报告验证 Schema
const createReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export class ReportController {
  private models: ReturnType<typeof models>;

  constructor(models: ReturnType<typeof models>) {
    this.models = models;
  }

  /**
   * 生成健康报告
   */
  public createReport = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;
    const data = createReportSchema.parse(req.body);

    // 检查患者是否存在
    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    // 获取指定日期范围内的餐食记录
    const meals = this.models.mealRecord.findByDateRange(
      patientId,
      data.startDate,
      data.endDate
    );

    // 计算营养分数
    const avgScore = meals.length > 0
      ? meals.reduce((sum, meal) => sum + meal.nutritionScore, 0) / meals.length
      : 0;

    // 生成趋势数据
    const trends = meals.map(meal => ({
      date: meal.mealDate,
      calories: meal.calories,
      nutritionScore: meal.nutritionScore,
    }));

    // 生成建议
    const recommendations = [];
    if (avgScore < 60) {
      recommendations.push('建议增加蔬菜和水果的摄入量');
    }
    if (avgScore < 80) {
      recommendations.push('建议控制油盐摄入');
    }
    if (meals.length < 21) {
      recommendations.push('请保持规律饮食，建议每天记录三餐');
    }

    const report = this.models.healthReport.create({
      patientId,
      reportDate: new Date().toISOString(),
      startDate: data.startDate,
      endDate: data.endDate,
      nutritionScore: avgScore,
      trends: JSON.stringify(trends),
      recommendations: JSON.stringify(recommendations),
    });

    const response: ApiResponse = {
      success: true,
      data: {
        ...report,
        trends: JSON.parse(report.trends || '[]'),
        recommendations: JSON.parse(report.recommendations || '[]'),
      },
      message: '健康报告生成成功',
    };

    logger.info(`Health report created: ${patientId}`);
    res.status(201).json(response);
  });

  /**
   * 获取患者的健康报告列表
   */
  public getReports = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;

    const reports = this.models.healthReport.findByPatientId(patientId);

    const response: ApiResponse = {
      success: true,
      data: reports.map(report => ({
        ...report,
        trends: JSON.parse(report.trends || '[]'),
        recommendations: JSON.parse(report.recommendations || '[]'),
      })),
    };

    res.json(response);
  });

  /**
   * 获取单份报告
   */
  public getReport = asyncHandler(async (req: Request, res: Response) => {
    const { patientId, reportId } = req.params;

    const report = this.models.healthReport.findById(reportId);
    if (!report || report.patientId !== patientId) {
      throw new AppError('报告不存在', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...report,
        trends: JSON.parse(report.trends || '[]'),
        recommendations: JSON.parse(report.recommendations || '[]'),
      },
    };

    res.json(response);
  });

  /**
   * 获取最新报告
   */
  public getLatestReport = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;

    const report = this.models.healthReport.findLatest(patientId);

    if (!report) {
      throw new AppError('暂无报告', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...report,
        trends: JSON.parse(report.trends || '[]'),
        recommendations: JSON.parse(report.recommendations || '[]'),
      },
    };

    res.json(response);
  });
}

export function createReportController(models: ReturnType<typeof models>) {
  return new ReportController(models);
}